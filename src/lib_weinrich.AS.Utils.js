//Java-Pakete
importPackage(Packages.org.apache.commons.io);

//ELO-Pakete
importPackage(Packages.de.elo.ix.client);

var weinrich = {};
weinrich.as = {};

/**
 * Allgemeine Funktionen
 * @namespace weinrich.as.Utils
 * @type {object}
 * @version 1.0.0
 */
weinrich.as.Utils = {

    /**
    * Log-Konfiguration. Vor dem loggen immer mit initLogging zu initialisieren.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.Utils
    * @type     {object}
    * @property {bool}      initialized     True, wenn logConfig initialisiert wurde
    * @property {String}    asRuleName      Name der laufenden AS-Regel
    * @property {bool}      debugMode       Im Debug-Mode wird alles geloggt. Ansonsten nur das wichtigste und Fehler
    */   
    logConfig: {
        "initialized": false,
        "asRuleName": "",
        "debugMode": false
    },


    // # -----------------------------------------------------

    /**
    * Initialisiert die Log-Konfiguration.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.Utils
    * @method   initLogging
    * @param    {bool}      debugMode      Log im Debug-Modus
    * @param    {String}    asRuleName     Name der AS-Regel
    */   
    initLogging: function (debugMode, asRuleName) {		
        
        this.logConfig["initialized"] = true;
        this.logConfig["debugMode"] = debugMode;
        this.logConfig["asRuleName"] = "--- " + asRuleName + ": ";
	},	

    /**
    * Loggt den übergebenen String. Nur mitloggen, wenn man im Debug-Modus ist oder eine hohe Priorität vorliegt.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.Utils
    * @method   logging
    * @param    {bool}   highPriority   Hohe Priorität loggt immer
    * @param    {String} text           Zu loggender Text
    */  
    logging: function(highPriority, text) {		
        
        if (this.logConfig.initialized == true) {

            try {
                //Wenn hohe Priorität, dann schreibe ins Log, auch wenn Debug-Modus deaktiviert ist.
                if (highPriority || this.logConfig.debugMode) {
                    log.info(this.logConfig.asRuleName + text);
                }
            }
            catch (ex) {
                log.info("\n\nLogging error ...\n" + ex + "\n");
            }
        }
        else {
            log.info("\n\nInitialize Log-Config before logging.\n\n");            
        }
	},	

    /**
    * Importiert eine Datei in ELO.
    * @author   Erik Köhler - Weinrich
    * @param    {File}      file       File dere zu importierenden Datei
    * @param    {int}       sordId     ObjId des Sords, in das die Datei importiert werden soll
    * @param    {String}    maskName   Name der Maske, welche die Datei in ELO bekommen soll
    * @param    {Object}    objKeysObj Indexfelder mit Werten, welche das Dokument bekommen soll. 
    *                                  Beispiel: {"ELOSTATUS":"Imported"}
    * @return   {bool}                 True wenn erfolgreich importiert
    */
    importDocument: function (file, sordId, maskName, objKeysObj) {
                
        try {           
            this.logging(false, "Import file: " + file.name);
            
            objKeysObj[DocMaskLineC.NAME_FILENAME] = file.name;

            var ed = ixConnect.ix().createDoc(sordId, maskName, null, EditInfoC.mbSordDocAtt);
            ed.sord.name = file.name;

            var key;
            for (key in objKeysObj) {
                ix.setIndexValueByName(ed.sord, key, objKeysObj[key]);
            }

            var objKeys = Array.prototype.slice.call(ed.sord.objKeys);
            objKeys.push(this.createObjKey(DocMaskLineC.ID_FILENAME, DocMaskLineC.NAME_FILENAME, file.name));
            ed.sord.objKeys = objKeys;

            ed.document.docs = [new DocVersion()];
            ed.document.docs[0].ext = fu.getExt(file);
            ed.document.docs[0].pathId = ed.sord.path;
            ed.document.docs[0].encryptionSet = ed.sord.details.encryptionSet;
            ed.document = ixConnect.ix().checkinDocBegin(ed.document);
            ed.document.docs[0].uploadResult = ixConnect.upload(ed.document.docs[0].url, file);
            ed.document = ixConnect.ix().checkinDocEnd(ed.sord, SordC.mbAll, ed.document, LockC.NO);

            this.logging(false, "Successfully imported " + file.name);

            return true;
        }
        catch (ex) {
            this.logging(true, "Fehler beim importieren der Datei " + file.name + "\n" + ex);
            
            return false;
        }
  	},

    /**
    * Prüfe, ob diese Datei bereits in ELO existiert.
    * @author   Erik Köhler - Weinrich
    * @param    {File}   file   Pfad für die Datei/den Ordner, der zu prüfen ist
    * @return   {bool}          True wenn Datei bereits in ELO existiert
    */
	hasDoublet: function (file) {
		
		if (Packages.de.elo.mover.utils.ELOAsUtils.findDoublet(emConnect, file))			
			return true;
		else		
			return false;
	},

    /**
    * Lösche Sord.
    * @author   Erik Köhler - Weinrich
    * @param    {int}   sordId              ObjId des zu löschenden Sords
    * @param    {bool}  folderMustBeEmpty   Lösche nur einen Ordner, wenn dieser bereits leer ist
    * @return   {bool}                      True wenn Sord erfolgreich gelöscht wurde
    */
	deleteSord: function(sordId, folderMustBeEmpty) {

        try {
            //Lädt Sord über die sordId
            var ed = ixConnect.ix().checkoutDoc(sordId, null, EditInfoC.mbSordDocAtt, LockC.NO);
            var sord = ed.sord;

            //Konfiguriere die Löschoptionen
			var delOptions = new DeleteOptions();
			
            //Lösche nur einen Ordner, wenn dieser bereits leer ist
            delOptions.folderMustBeEmpty = folderMustBeEmpty;

            try {
                //Lösche den angegebenen Ordner, falls er leer ist oder folderMustBeEmpty=false
                return ixConnect.ix().deleteSord(sord.getParentId(), sord.getId(), LockC.NO, delOptions);
            }
            catch(e2) {
                // ! Verzeichnis noch nicht leer! Mache dann nichts
                this.logging(true, "Fehler beim Löschen des Sords (" + sordId + ").\n" + e2);
            }

            ixConnect.ix().checkinDocEnd(ed.sord, SordC.mbAll, ed.document, LockC.NO);
        }
        catch(e1) {
            this.logging(true, e1);
        }

        return false;
	},

    /**
    * Verschiebt das Sord in das neue Verzeichnis in ELO. Wurde das Verzeichnis dadurch komplett geleert, lösche es.
    * @author   Erik Köhler - Weinrich
    * @param    {int}   sourceId            ObjId des zu verschiebenden Sords
    * @param    {int}   destId              ObjId des Verzeichnisses, in das das Sord verschoben werden soll
    * @return   {bool}                      True wenn Elternverzeichnis gelöscht wurde, weil es leer wurde
    */
    moveSordCleanUpAfter: function(sourceId, destId) {
		
        //Lade Sord über ObjId
        var sourceSord = ixConnect.ix().checkoutSord(sourceId, EditInfoC.mbAll, LockC.NO).sord;
        ixConnect.ix().checkinSord(sourceSord, SordC.mbAll, LockC.NO);
        
		//Verschiebe das Dokument in das passende Verzeichnis
        ixConnect.ix().copySord(destId, sourceSord.id, null, CopySordC.MOVE);

        //Lösche Eltern-Sord, wenn dieses nach dem Verschieben leer wurde
        return this.deleteSord(sourceSord.parentId, true);
    },
    
    /**
    * Löscht das Sord in ELO. Wurde das Eltern-Verzeichnis dadurch komplett geleert, lösche es.
    * @author   Erik Köhler - Weinrich
    * @param    {int}   sourceId            ObjId des zu löschenden Sords
    * @return   {bool}                      True wenn Elternverzeichnis gelöscht wurde, weil es leer wurde
    */
    deleteSordCleanUpAfter: function (sourceId) {
        
		//Lade Sord über ObjId
        var sourceSord = ixConnect.ix().checkoutSord(sourceId, EditInfoC.mbAll, LockC.NO).sord;
        ixConnect.ix().checkinSord(sourceSord, SordC.mbAll, LockC.NO);

		//Lösche Sord
        this.deleteSord(sourceSord.id, true);

        //Lösche Eltern-Sord, wenn dieses nach dem Löschen leer wurde
        return this.deleteSord(sourceSord.parentId, true);
	},
	
    /**
    * Filtert die übergebene ArrayList. Prüft, ob ein string in der Kurzbezeichnung/Maske/Indexfeld existiert und
    * entfernt alle anderen aus der Liste.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterType             Art nach der gefiltert werden soll
    *                                                              Valide Werte: "Kurzbezeichnung", "Maske", "Indexfeld"
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @param    {String}                    fieldToFilterWith      Wenn filterType=Indexfeld, erwartet Name des Indexfeldes
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    */
    filterArrayListContains: function(sordArrList, filterType, filterValue, fieldToFilterWith) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {            
            var sordArrListValue = "";

            //Filtere die Liste abhängig von dem Ziel des Filters
            switch(filterType){
                case "Kurzbezeichnung": 
                    sordArrListValue = iterator.next().name;
                    break;

                case "Maske": 
                    sordArrListValue = iterator.next().maskName;
                    break;

                case "Indexfeld":

                    try {
                        sordArrListValue = this.getIndexfieldValue(iterator.next(), fieldToFilterWith)[0];
                    }
                    catch (ex) {
                        // ! Error beim Filtern nach Indexfeld
                        this.logging(true, "Fehler beim Filtern nach Indexfeld. " + ex);
                    }
                    
                    break;
                
                default:
                    break;
            }           

            //Prüfe, ob der String, nach dem gefiltert werden soll, in der Kurzbezeichnung existiert
            if (!sordArrListValue.contains(filterValue)) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Suche nach Dokumenten über die Kurzbezeichnung.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    maskname        Name der Maske, falls danach gefiltert werden soll. Ansonsten ""
    * @param    {String}    docname         Kurzbezeichnung, nach der gesucht werden soll
    * @param    {int}       numberOfResults Maximale Anzahl an Treffern, die gefunden werden können
    * @return   {Sord[]}                    Gibt die gefundenen Sords als Array zurück
    */
	getSordsByDocName: function(maskname, docname, numberOfResults) {
		var findInfo = new FindInfo();
        var findByIndex = new FindByIndex();

		//Wenn keine Maske angegeben wurde nur nach Kurzbezeichnung suchen
		if (maskname != "") {
			//Suche in bestimmter Maske...
			findByIndex.maskId = maskname;			
		}
        
        //...nach folgender Kurzbezeichnung
        findByIndex.name = docname;

        findInfo.setFindByIndex(findByIndex);

        try {
            var findResult = ixConnect.ix().findFirstSords(findInfo, numberOfResults, SordC.mbAllIndex);
            var sords = findResult.getSords();
        }
        catch (ex) {
            // ! Error beim Suchen nach der Kurzbezeichnung
            this.logging(true, ex);
        }
        finally {
            if(findResult != null) {
                ixConnect.ix().findClose(findResult.getSearchId());
            }
        }
        
        return sords;
	},

    /**
    * Lade die Sords über die Suche nach Werten eines Indexfeldes
    * @author   Erik Köhler - Weinrich
    * @param    {String}    maskname        Name der Maske, falls danach gefiltert werden soll
    * @param    {String}    indexfeldName   Indexfeld, in dem gesucht werden soll
    * @param    {String}    indexfeldWert   Wert des Indexfeldes, nach dem gesucht werden soll
    * @param    {int}       numberOfResults Maximale Anzahl an Treffern, die gefunden werden können
    * @return   {Sord[]}                    Gibt die gefundenen Sords als Array zurück
    */
    getSordsByIndexfield: function(maskname, indexfeldName, indexfeldWert, numberOfResults) {
		var findInfo = new FindInfo();
        var findByIndex = new FindByIndex();

        //Suche in bestimmter Maske
        findByIndex.maskId = maskname;

        //Indexfeld-Suche
        var indexfeld = new ObjKey();
        indexfeld.data = [indexfeldWert];                     //zu suchender Wert
        indexfeld.name = indexfeldName;                       //Feld welches nach dem Wert gesucht wird

        //Alle Suchparameter ins Array schreiben
        var objKeys = new Array(indexfeld);

        //Suche ausführen
        findByIndex.objKeys = objKeys;

        findInfo.setFindByIndex(findByIndex);

        try {
            var findResult = ixConnect.ix().findFirstSords(findInfo, numberOfResults, SordC.mbAllIndex);
            var sords = findResult.getSords();
        }
        catch(ex) {
			// ! Error beim Suchen mit Indexfeld
            this.logging(true, e);
        }
        finally {
            if(findResult != null) {
                ixConnect.ix().findClose(findResult.getSearchId());
            }
        }
        
        return sords;
    },

    /**
    * Prüfe, ob Verzeichnis in ELO existiert
    * @author   Erik Köhler - Weinrich
    * @param    {int}       parentId    Verzeichnis, in dem nach der Kurzbezeichnung gesucht werden soll
    * @param    {String}    folderName  Kurzbezeichnung, welches gesucht werden soll
    * @return   {bool}                  True, wenn Kurzbezeichnung bereits in Verzeichnis existiert  
    */
	checkFolderExistsInArchive: function(parentId, folderName) {
		
		//Lade das Elterverzeichnis
		var sords = Packages.de.elo.mover.utils.ELOAsUtils.getSubFolders(emConnect, parentId);
				
		for(var i = 0; i < sords.length; i++) {
			var sord = sords[i];
			
			if(sord.name == folderName) {		
				return true;
			}
		}
		
		return false;
	},

    /**
    * ändert das Icon eines Sords
    * @author   Erik Köhler - Weinrich
    * @param    {int}   sordId  ObjId des Sords, dessen Icon geändert werden soll
    * @param    {int}   iconId  Id des Icons, welches das Sord bekommen soll
    * @return   {bool}          True, wenn Icon erfolgreich geändert wurde
    */
	setSordIcon: function(sordId, iconId) {
		
        try {
            var sordZ = new SordZ(SordC.mbId | SordC.mbType);
            var sord = ixConnect.ix().checkoutSord(sordId, sordZ, LockC.NO);

            if (sord.type != iconId) {

                sord.type = iconId;
                ixConnect.ix().checkinSord(sord, sordZ, LockC.NO);
                
                this.logging(false, "Icon des Ordners  " + sordId + " geändert auf Eintragstyp mit der ID " + iconId);
                return true;
            }
        }
        catch (ex) {
            this.logging(true, "Fehler beim Ändern des Icons für " + sordId);
            return false;
        }		
	},

    /**
    * Fügt einen Wert in ein Indexfeld ein, auch wenn noch kein Wert dafür in der DB steht.
    * @author   Erik Köhler - Weinrich
    * @param    {Sord}      sord            Sord, für das das Indexfeld beschrieben werden soll
    * @param    {String}    inputString     String, welcher in das Indexfeld geschrieben wird
    * @param    {String}    maskLineKey     Name des Indexfeldes
    * @param    {int}       maskLineId      Id des Indexfeldes
    * @return   {bool}                      True, wenn Indexfeld erfolgreich beschrieben wurde
    */
    insertStringInIndexfield: function (sord, inputString, maskLineKey, maskLineId) {
		try {
			var tempSord = ixConnect.ix().checkoutSord(sord.id, EditInfoC.mbAll, LockC.NO).sord;
			var objKeys = Array.prototype.slice.call(tempSord.objKeys);
			objKeys.push(this.createObjKey(maskLineId, maskLineKey, inputString));
			tempSord.objKeys = objKeys;
            ixConnect.ix().checkinSord(tempSord, SordC.mbAll, LockC.NO);
            
            return true;
		}
		catch (ex) {
            this.logging(true, ex);  
            
            return false;
		}
	},
	
    /**
    * Setze die Schriftfarbe eines Sords
    * @author   Erik Köhler - Weinrich
    * @param    {Sord}  sord        Sord, für das die Farbe geändert werden soll
    * @param    {int}   colorId     Id des Icons, welches das Sord bekommen soll
    * @return   {bool}              True, wenn Farbe erfolgreich geändert wurde
    */
    setSordColor: function(sord, colorId) {
		try {           
            //Prüfe, ob es eine NEUE Farbe ist
			if (sord.kind != colorId) {
				
                //Setze die neue Farbe
				Packages.de.elo.mover.utils.ELOAsColorUtils.setColor(emConnect, [sord.id], colorId);
				
                this.logging(false, sord.name + " wurde umgefärbt. Neue FarbId = " + colorId);  
            }

            return true;
        }
        catch(ex) {
			this.logging(true, "Es ist ein Fehler beim Setzen der Farbe aufgetreten. " + ex);
            return false;
        }
	},

    /**
    * Erstelle neuen Eintrag für Indexfeld
    * @author   Erik Köhler - Weinrich
    * @param    {int}       id      Id des Indexfeldes
    * @param    {String}    name    Name des Indexfeldes
    * @param    {String}    value   Wert des Indesfeldes
    * @return   {ObjKey}            Erstellter ObjKey
    */
	createObjKey: function (id, name, value) {
        var objKey = new ObjKey();
        objKey.id = id;
        objKey.name = name;
        objKey.data = [value];
        return objKey;
    },
    
	/**
    * Schreibe einen Feed-Eintrag
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId  ObjId des Sords, für das ein Feed-Eintrag geschrieben werden soll
    * @param    {String}    text    Text des Feed-Eintrags
    * @return   {bool}              True, wenn Feed-Eintrag erfolgreich geschrieben wurde
    */
	createFeedEntry: function(sordId, text) {
        try {
            Packages.de.elo.mover.utils.ELOAsServerUtils.createFeedAction(emConnect, sordId, text);            
            return true;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Erstellen eines Feed-Eintrags für " + sordId + ".\n" + ex);
            return false;
        }
	},

    /**
    * Setze ein Mapfeld in einem Sord über dessen objId
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId des Sords, für das das Mapfeld gesetzt werden soll
    * @param    {String}    mapName     Name des zu setzenden Mapfeldes
    * @param    {String}    mapValue    Wert, welcher in das Mapfeld geschrieben werden soll
    * @return   {bool}                  True, wenn Mapfeld erfolgreich gesetzt wurde
    */
    setMapValue: function (sordId, mapName, mapValue) {
        
        try {
            Packages.de.elo.mover.utils.ELOAsSordUtils.setMapValue(emConnect, sordId, mapName, mapValue);          
            return true;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Setzen eines Mapfeldes für " + sordId + ".\n" + ex);
            return false;
        }
	},

    /**
    * Lade die Mapfeld-Werte eines Sords über den Namen des Mapfeldes
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId des Sords, für das das Mapfeld geladen werden soll
    * @param    {String}    mapName     Name des zu ladenden Mapfeldes
    * @return   {String[]}              Wert des Indexfeldes, bei Fehler undefined
    */
    getMapValues: function (sordId, mapName) {
        
        try {
            return Packages.de.elo.mover.utils.ELOAsSordUtils.getMapValues(emConnect, sordId, mapName);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Wertes eines Mapfeldes für " + sordId + ".\n" + ex);
            return undefined;
        }
	},

    /**
    * Lade die Indexfeld-Werte eines Sords über die ObjKeyId des Indexfeldes
    * @author   Erik Köhler - Weinrich
    * @param    {Sord}      sord       Sord, aus dem der Wert des Indexfelds geladen werden soll
    * @param    {int}       objKeyId   ObjKeyId des Indexfeldes
    * @return   {String[]}             Wert des Indexfeldes, bei Fehler undefined
    */
    getIndexfieldValue: function (sord, objKeyId) {
        
        try {
            return Packages.de.elo.mover.utils.ELOAsSordUtils.getObjKeyData(sord, objKeyId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Wertes eines Indexfeldes für " + sord.id + ".\n" + ex);
            return undefined;
        }
    },
    
    /**
    * Lade die Indexfeld-Werte eines Sords über den Namen des Indexfeldes
    * @author   Erik Köhler - Weinrich
    * @param    {Sord}      sord                Sord, aus dem der Wert des Indexfelds geladen werden soll
    * @param    {String}    objKeyGroupName     Name des Indexfeldes
    * @return   {String[]}                      Wert des Indexfeldes, bei Fehler undefined
    */
    getIndexfieldValue: function (sord, objKeyGroupName) {
        try {
            return Packages.de.elo.mover.utils.ELOAsSordUtils.getObjKeyData(sord, objKeyGroupName);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Wertes eines Mapfeldes für " + sord.id + ".\n" + ex);
            return undefined;
        }
	},
	
    /**
    * Setze den Wert eines Indexfeldes in einem Sord über die ObjKeyId des Indexfeldes
    * @author   Erik Köhler - Weinrich
    * @param    {Sord}      sord        Sord, in dem der Wert des Indexfelds gesetzt werden soll
    * @param    {String}    objKeyId    ObjKeyId des Indexfeldes
    * @param    {String}    data        Wert, der in das Indexfeld geschrieben werden soll
    * @return   {bool}                  True, wenn Indexfeld erfolgreich gesetzt wurde
    */
    setIndexfieldValue: function (sord, objKeyId, data) {
        
        try {
            Packages.de.elo.mover.utils.ELOAsSordUtils.setObjKeyData(sord, objKeyId, data);
            return true;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Setzen des Wertes eines Indexfeldes für " + sord.id + ".\n" + ex);
            return false;
        }
	},

    /**
    * Setze den Wert eines Indexfeldes in einem Sord über den Namen des Indexfeldes
    * @author   Erik Köhler - Weinrich
    * @param    {Sord}      sord                Sord, in dem der Wert des Indexfelds gesetzt werden soll
    * @param    {String}    objKeyGroupName     Name des Indexfeldes
    * @param    {String}    data                Wert, der in das Indexfeld geschrieben werden soll
    * @return   {bool}                          True, wenn Indexfeld erfolgreich gesetzt wurde
    */
    setIndexfieldValue: function (sord, objKeyGroupName, data) {
        
        try {
            Packages.de.elo.mover.utils.ELOAsSordUtils.setObjKeyData(sord, objKeyGroupName, data);
            return true;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Setzen des Wertes eines Indexfeldes für " + sord.id + ".\n" + ex);
            return false;
        }
	},

    /**
    * Lade alle Kind-Sords eines Eltern-Sords über dessen Id
    * @author   Erik Köhler - Weinrich
    * @param    {int}                           parentId    Eltern-Sord für das alle Kind-Sords geladen werden sollen
    * @return   {java.util.ArrayList<Sord>}                 Alle Kind-Sords des Eltern-Sords
    */
    getChildren: function (parentId) {	
        
        try {
            return Packages.de.elo.mover.utils.ELOAsSordUtils.getChildren(emConnect, parentId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden aller Kind-Sords von  " + parentId + ".\n" + ex);
            return undefined;
        }
	},

    /**
    * Lade alle Unterverzeichnisse eines Sords über dessen Id
    * @author   Erik Köhler - Weinrich
    * @param    {int}                           parentId    Sord, für das die Unterverzeichnisse geladen werden sollen
    * @return   {java.util.ArrayList<Sord>}                 Alle Unterverzeichnisse des Sords
    */
    getSubFolders: function (parentId) {		
        
        try {
            return Packages.de.elo.mover.utils.ELOAsUtils.getSubFolders(emConnect, sourceSordId);	
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden der Unterverzeichnisse von  " + parentId + ".\n" + ex);
            return undefined;
        }
	},

    /**
    * Gibt den Pfad eines Sords über seine ID zurück
    * @author   Erik Köhler - Weinrich
    * @param    {int}        sordId     Sord, für das der ELO-Pfad bestimmt werden soll
    * @return   {String}                ELO-Pfad des Sords
    */
    getElementPath: function (sordId) {	
        try {
            return Packages.de.elo.mover.utils.ELOAsUtils.getElementPath(emConnect, sordId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Bestimmen des ELO-Pfades von Sord " + sordId + ".\n" + ex);
            return undefined;
        }
	},

    /**
    * Gibt ein Sord über seinen Arc-Pfad zurück
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Vollständiger Pfad des zu ladenden Sords
    * @return   {Sord}              Sord, der über den Pfad geladen wurde
    */
	// 
    getElemByArcpath: function (path) {		
        try {
            return Packages.de.elo.mover.utils.ELOAsUtils.getElemByArcpath(emConnect, path);	
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden eines Sords über seinen Arc-Pfad. " + path + ".\n" + ex);
            return undefined;
        }
    },

    /**
    * Gibt ein Sord über seinen relativen Arc-Pfad zurück
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Vollständiger Pfad des zu ladenden Sords
    * @return   {Sord}              Sord, der über den  relativen Arc-Pfad geladen wurde
    */
    getElemByArcpath: function (path, rootId) {		
        try {
            return Packages.de.elo.mover.utils.ELOAsUtils.getElemByArcpath(emConnect, rootId, path);	
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden eines Sords über seinen relativen Arc-Pfad. " + path + ".\n" + ex);
            return undefined;
        }
    },

    /**
    * Fügt ein neues Verzeichnis über den übergebenen Pfad in ELO hinzu und gibt dessen ObjId zurück.
    * Der Pfad wird vollständig angelegt.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Vollständiger Pfad des zu ladenden Sords
    * @return   {int}               ObjId des neu angelegten Verzeichnisses
    */
    createArcPath: function(eloPath) {
		
        try {
            //Entferne das root-Verzeichnis aus dem Pfad
            eloPath = eloPath.replace("ARCPATH:","");
            
            return Packages.de.elo.mover.utils.ELOAsUtils.createArcPath(emConnect, 1, eloPath);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Erstellen des neuen Verzeichnisses. " + eloPath + ".\n" + ex);
            return -1;
        }
	},

    /**
    * Füge ein neues Verzeichnis hinzu und gibt dessen ObjId zurück
    * @author   Erik Köhler - Weinrich
    * @param    {int}       parentId    Verzeichnis, in das das neue Verzeichnis erstellt werden soll
    * @param    {String}    folderName  Name des neuen Verzeichnisses
    * @param    {String}    maskName    Name der Maske für das neue Verzeichnis
    * @return   {int}                   ObjId des neu angelegten Verzeichnisses
    */
    addNewFolder: function (parentId, folderName, maskName) {		
        
        try {            
		    return Packages.de.elo.mover.utils.ELOAsUtils.addNewFolder(emConnect, folderName, parentId, maskName);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Erstellen des neuen Verzeichnisses in " + parentId + ".\n" + ex);
            return -1;
        }
	},
	
    /**
    * Prüft, ob das Sord eine Referenz ist
    * @author   Erik Köhler - Weinrich
    * @param    {int}    sordId     ObjId, des zu prüfenden Sords
    * @return   {bool}              True, wenn Sord eine Referenz ist. Bei Fehler gebe -1 zurück
    */
    isReference: function (sordId) {
        
        try {    
            //Lade Sord über ObjId
            var sord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbAll, LockC.NO).sord;
            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);
    
            return Packages.de.elo.mover.utils.ELOAsSordUtils.isReference(emConnect, sord.id, sord.parentId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Prüfen, ob Sord " + sordId + " eine Referenz ist.\n" + ex);
            return -1;
        }
	},
    
    // # -----------------------------------------------------
};

/**
 * Funktionen für Zeit und Datum
 * @memberof weinrich.as
 * @type {object}
 * @namespace weinrich.as.DateUtils
 */
weinrich.as.DateUtils = {

    /**
    * Gibt das aktuelle DateTime ohne Zeit zurück 
    * @author   Erik Köhler - Weinrich
    * @return   {Date}  Gibt das aktuelle Datum ohne Uhrzeit zurück. Bei Fehler undefinded
    */
    getCurrentDate: function () {	
        try {    
		    return Packages.de.elo.mover.utils.ELOAsDateUtils.getDateWithoutTime(Packages.de.elo.mover.utils.ELOAsDateUtils.getToday());	
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Laden des aktuellen Datums.\n" + ex);
            return undefined;
        }
    },

    /**
    * Gibt das heutige DateTime plus x Minuten zurück. Wähle negativen Wert bei minutes für minus x Tage
    * @author   Erik Köhler - Weinrich
    * @return   {Date}  Um x Minuten verschobene Uhrzeit
    */
    getDateTimeMinutesLater: function(minutes) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.MINUTE, minutes);
        return cal.getTime();
    },
    
    /**
    * Gibt das heutige DateTime plus x Stunden zurück. Wähle negativen Wert bei hours für minus x Stunden
    * @author   Erik Köhler - Weinrich
    * @return   {Date}  Um x Stunden verschobene Uhrzeit
    */
    getDateTimeHoursLater: function(hours) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.HOUR, hours);
        return cal.getTime();
    },
    
    /**
    * Gibt das heutige DateTime plus x Tage zurück. Wähle negativen Wert bei days für minus x Tage
    * @author   Erik Köhler - Weinrich
    * @return   {Date}  Um x Minuten verschobene Uhrzeit
    */
    getDateTimeDaysLater: function(days) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.DAY, days);
        return cal.getTime();
    },

    /**
    * Gibt das heutige DateTime plus x Monate zurück. Wähle negativen Wert bei months für minus x Monate
    * @author   Erik Köhler - Weinrich
    * @return   {Date}  Um x Monate verschobene Uhrzeit
    */
    getDateTimeMonthsLater: function(months) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.MONTH, months);
        return cal.getTime();
    },

    /**
    * Gibt das heutige DateTime plus x Jahre zurück. Wähle negativen Wert bei years für minus x Jahre
    * @author   Erik Köhler - Weinrich
    * @return   {Date}  Um x Jahre verschobene Uhrzeit
    */
    getDateTimeYearsLater: function(years) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.YEAR, years);
        return cal.getTime();
    },

    /**
    * Gibt zurück, ob das erste Datum nach dem zweiten Datum liegt
    * @author   Erik Köhler - Weinrich
    * @return   {bool}  True, wenn erstes Datum nach dem zweiten Datum. Bsp.: 01.01.2000 > 01.01.1990 => true
    */
    dateIsLater: function (firstDate, secondDate) {	
        try {
            return Packages.de.elo.mover.utils.ELOAsDateUtils.isNewerThan(firstDate, secondDate);
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler bei der Prüfung, ob ein Datum nach dem anderen liegt.\n" + ex);
            return undefined;
        }	
    },    

    /**
    * Ändere ausgeschriebenen Monat in Monatsnummer
    * @author   Erik Köhler - Weinrich
    * @param    {String}    month   Ausgeschriebener Monat. Beispiel: "Februar"
    * @return   {String}            Monatsnummer als String. Beispiel: "Januar" -> "01"  
    */
	changeMonthToMonthNumber: function (month) {
		var monthNumber = "";
        
        if(month == "Januar") {
            monthNumber = "01";
        } else if(month == "Februar") {
            monthNumber = "02";
        } else if(month == "März") {
            monthNumber = "03";
        } else if(month == "April") {
            monthNumber = "04";
        } else if(month == "Mai") {
            monthNumber = "05";
        } else if(month == "Juni") {
            monthNumber = "06";
        } else if(month == "Juli") {
            monthNumber = "07";
        } else if(month == "August") {
            monthNumber = "08";
        } else if(month == "September") {
            monthNumber = "09";
        } else if(month == "Oktober") {
            monthNumber = "10";
        } else if(month == "November") {
            monthNumber = "11";
        } else if(month == "Dezember") {
            monthNumber = "12";
        }

		return monthNumber;
	},
};

/**
 * Funktionen auf Dateiebene
 * @memberof weinrich.as
 * @namespace weinrich.as.FileUtils
 * @type {object}
 */
weinrich.as.FileUtils = {
     
    /**
    * Prüft, ob der übergebene Pfad existiert.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   pathExists
    * @param    {File}   path   Pfad für die Datei/den Ordner, der zu prüfen ist
    * @return   {bool}          True wenn Pfad existiert
    */
    pathExists: function (path) {
            
        return path.exists();
    },
        
    /**
    * Prüft, ob der übergebene Pfad auf ein Verzeichnis verweist.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   isDirectory
    * @param    {File}   path   Pfad für die Datei/den Ordner, der zu prüfen ist
    * @return   {bool}          True wenn Verzeichnis
    */
    isDirectory: function (path) {
        
        return path.isDirectory();
    },

    /**
    * Prüft, ob der übergebene Pfad auf eine Datei verweist.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   isFile
    * @param    {File}   path   Pfad für die Datei/den Ordner, der zu prüfen ist
    * @return   {bool}          True wenn Datei
    */
    isFile: function (path) {
        
        return !path.isDirectory();
    },

    /**
    * Kopiert eine Datei in den angegebenen Pfad.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   copyFileTo
    * @param    {File}   sourceFile     Pfad auf die zu kopierende Datei
    * @param    {File}   destFile       Pfad an die Stelle, wohin die Datei kopiert werden soll
    * @param    {bool}   overwrite      Überschreibe die Datei, falls der Pfad auf ein bereits existierendes File verweist
    * @return   {bool}                  True wenn erfolgreich kopiert
    */
    copyFileTo: function (sourceFile, destFile, overwrite) {        
        try {
            org.apache.commons.io.FileUtils.copyFile(sourceFile, destFile, overwrite);
            return true;
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Kopieren der Datei.\n" + ex);
            return false;
        }
    },

    /**
    * Verschiebt eine Datei in den angegebenen Pfad.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   moveFileTo
    * @param    {File}   sourceFile     Pfad auf die zu verschiebende Datei
    * @param    {File}   destFile       Pfad an die Stelle, wohin die Datei verschoben werden soll
    * @param    {bool}   overwrite      Überschreibe die Datei, falls der Pfad auf ein bereits existierendes File verweist
    * @return   {bool}                  True wenn erfolgreich verschoben
    */
    moveFileTo: function (sourceFile, destFile, overwrite) {        
        try {
            if (overwrite) {
                org.apache.commons.io.deleteQuietly(destFile);
            }
            org.apache.commons.io.FileUtils.moveFile(sourceFile, destinationFilePath);
            return true;
        }
        catch(ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Verschieben der Datei.\n" + ex);
            return false;
        }
    },

};