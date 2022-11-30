//Java-Pakete
importPackage(Packages.org.apache.commons.io);

//ELO-Pakete
importPackage(Packages.de.elo.ix.client);

/**
* Namespace für Weinrich
* @author   Erik Koehler - Weinrich
* @version 1.0.0
* @namespace weinrich
*/
var weinrich = {};

/**
 * Namespace für weinrich.Utils
 * @memberof weinrich
 * @type {object}
 * @namespace weinrich.Utils
 */
weinrich.Utils = {
    
    // # Variables

    logConfig: {
        "initialized": false,
        "asRuleName": "",
        "debugMode": false
    },


    // # -----------------------------------------------------
    // # Functions

    /**
    * Initialisiert die Log-Konfiguration.
    * @author   Erik Koehler - Weinrich
    * @memberof weinrich.Utils
    * @method   initLogging
    * @param    {bool}   debugMode      Log im Debug-Modus
    * @param    {String} asRuleName     Name der AS-Regel
    */   
    initLogging: function (debugMode, asRuleName) {		
        
        this.logConfig["initialized"] = true;
        this.logConfig["debugMode"] = debugMode;
        this.logConfig["asRuleName"] = "--- " + asRuleName + ": ";
	},	

    /**
    * Loggt den uebergebenen String. Nur mitloggen, wenn man im Debug-Modus ist oder eine hohe Prioritaet vorliegt.
    * @author   Erik Koehler - Weinrich
    * @param    {bool}   highPriority   Hohe Prioritaet loggt immer
    * @param    {String} text           Zu loggender Text
    */  
    logging: function(highPriority, text) {		
        
        if (this.logConfig.initialized == true) {

            try {
                //Wenn hohe Prioritaet, dann schreibe ins Log, auch wenn Debug-Modus deaktiviert ist.
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
    * Prueft, ob der uebergebene Pfad existiert.
    * @author   Erik Koehler - Weinrich
    * @param    {File}   path   Pfad fuer die Datei/den Ordner, der zu pruefen ist
    * @return   {bool}          True wenn Pfad existiert
    */
	pathExists: function (path) {
		
		return path.exists();
	},
	    
	/**
    * Prueft, ob der uebergebene Pfad auf ein Verzeichnis verweist.
    * @author   Erik Koehler - Weinrich
    * @param    {File}   path   Pfad fuer die Datei/den Ordner, der zu pruefen ist
    * @return   {bool}          True wenn Verzeichnis
    */
	isDirectory: function (path) {
		
		return path.isDirectory();
	},

    /**
    * Prueft, ob der uebergebene Pfad auf eine Datei verweist.
    * @author   Erik Koehler - Weinrich
    * @param    {File}   path   Pfad fuer die Datei/den Ordner, der zu pruefen ist
    * @return   {bool}          True wenn Datei
    */
	isFile: function (path) {
		
		return !path.isDirectory();
    },
    
    /**
    * Kopiert eine Datei in den angegebenen Pfad.
    * @author   Erik Koehler - Weinrich
    * @param    {File}   sourceFile     Pfad auf die zu kopierende Datei
    * @param    {File}   destFile       Pfad an die Stelle, wohin die Datei kopiert werden soll
    * @param    {bool}   overwrite      Ueberschreibe die Datei, falls der Pfad auf ein bereits existierendes File verweist
    * @return   {bool}                  True wenn erfolgreich kopiert
    */
    copyFileTo: function (sourceFile, destFile, overwrite) {        
        try {
            org.apache.commons.io.FileUtils.copyFile(sourceFile, destFile, overwrite);
            return true;
        }
        catch(ex) {
            log.info(ex);
            return false;
        }
    },

    /**
    * Verschiebt eine Datei in den angegebenen Pfad.
    * @author   Erik Koehler - Weinrich
    * @param    {File}   sourceFile     Pfad auf die zu verschiebende Datei
    * @param    {File}   destFile       Pfad an die Stelle, wohin die Datei verschoben werden soll
    * @param    {bool}   overwrite      Ueberschreibe die Datei, falls der Pfad auf ein bereits existierendes File verweist
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
            log.info(ex);
            return false;
        }
    },

    /**
    * Importiert eine Datei in ELO.
    * @author   Erik Koehler - Weinrich
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
    * Pruefe, ob diese Datei bereits in ELO existiert.
    * @author   Erik Koehler - Weinrich
    * @param    {File}   file   Pfad fuer die Datei/den Ordner, der zu pruefen ist
    * @return   {bool}          True wenn Datei bereits in ELO existiert
    */
	hasDoublet: function (file) {
		
		if (Packages.de.elo.mover.utils.ELOAsUtils.findDoublet(emConnect, file))			
			return true;
		else		
			return false;
	},

    /**
    * Loesche Sord.
    * @author   Erik Koehler - Weinrich
    * @param    {int}   sordId              ObjId des zu loeschenden Sords
    * @param    {bool}  folderMustBeEmpty   Loesche nur einen Ordner, wenn dieser bereits leer ist
    * @return   {bool}                      True wenn Sord erfolgreich geloescht wurde
    */
	deleteSord: function(sordId, folderMustBeEmpty) {

        try {
            //Laedt Sord ueber die sordId
            var ed = ixConnect.ix().checkoutDoc(sordId, null, EditInfoC.mbSordDocAtt, LockC.NO);
            var sord = ed.sord;

            //Konfiguriere die Loeschoptionen
			var delOptions = new DeleteOptions();
			
            //Loesche nur einen Ordner, wenn dieser bereits leer ist
            delOptions.folderMustBeEmpty = folderMustBeEmpty;

            try {
                //Loesche den angegebenen Ordner, falls er leer ist oder folderMustBeEmpty=false
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
    * Verschiebt das Sord in das neue Verzeichnis in ELO. Wurde das Verzeichnis dadurch komplett geleert, loesche es.
    * @author   Erik Koehler - Weinrich
    * @param    {int}   sourceId            ObjId des zu verschiebenden Sords
    * @param    {int}   destId              ObjId des Verzeichnisses, in das das Sord verschoben werden soll
    * @return   {bool}                      True wenn Elternverzeichnis geloescht wurde, weil es leer wurde
    */
    moveSordCleanUpAfter: function(sourceId, destId) {
		
        //Lade Sord ueber ObjId
        var sourceSord = ixConnect.ix().checkoutSord(sourceId, EditInfoC.mbAll, LockC.NO).sord;
        ixConnect.ix().checkinSord(sourceSord, SordC.mbAll, LockC.NO);
        
		//Verschiebe das Dokument in das passende Verzeichnis
        ixConnect.ix().copySord(destId, sourceSord.id, null, CopySordC.MOVE);

        //Loesche Eltern-Sord, wenn dieses nach dem Verschieben leer wurde
        return this.deleteSord(sourceSord.parentId, true);
    },
    
    /**
    * Loescht das Sord in ELO. Wurde das Eltern-Verzeichnis dadurch komplett geleert, loesche es.
    * @author   Erik Koehler - Weinrich
    * @param    {int}   sourceId            ObjId des zu loeschenden Sords
    * @return   {bool}                      True wenn Elternverzeichnis geloescht wurde, weil es leer wurde
    */
    deleteSordCleanUpAfter: function (sourceId) {
        
		//Lade Sord ueber ObjId
        var sourceSord = ixConnect.ix().checkoutSord(sourceId, EditInfoC.mbAll, LockC.NO).sord;
        ixConnect.ix().checkinSord(sourceSord, SordC.mbAll, LockC.NO);

		//Loesche Sord
        this.deleteSord(sourceSord.id, true);

        //Loesche Eltern-Sord, wenn dieses nach dem Loeschen leer wurde
        return this.deleteSord(sourceSord.parentId, true);
	},
	
    /**
    * Filtert die uebergebene ArrayList. Prueft, ob ein string in der Kurzbezeichnung/Maske/Indexfeld existiert und
    * entfernt alle anderen aus der Liste.
    * @author   Erik Koehler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterType             Art nach der gefiltert werden soll
    *                                                              Valide Werte: "Kurzbezeichnung", "Maske", "Indexfeld"
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @param    {String}                    fieldToFilterWith      Wenn filterType=Indexfeld, erwartet Name des Indexfeldes
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    */
    filterArrayListContains: function(sordArrList, filterType, filterValue, fieldToFilterWith) {

        //Erstelle einen Iterator fuer die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {            
            var sordArrListValue = "";

            //Filtere die Liste abhaengig von dem Ziel des Filters
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

            //Pruefe, ob der String, nach dem gefiltert werden soll, in der Kurzbezeichnung existiert
            if (!sordArrListValue.contains(filterValue)) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Suche nach Dokumenten ueber die Kurzbezeichnung.
    * @author   Erik Koehler - Weinrich
    * @param    {String}    maskname        Name der Maske, falls danach gefiltert werden soll. Ansonsten ""
    * @param    {String}    docname         Kurzbezeichnung, nach der gesucht werden soll
    * @param    {int}       numberOfResults Maximale Anzahl an Treffern, die gefunden werden koennen
    * @return   {Sord[]}                    Gibt die gefundenen Sords als Array zurueck
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
    * Lade die Sords ueber die Suche nach Werten eines Indexfeldes
    * @author   Erik Koehler - Weinrich
    * @param    {String}    maskname        Name der Maske, falls danach gefiltert werden soll
    * @param    {String}    indexfeldName   Indexfeld, in dem gesucht werden soll
    * @param    {String}    indexfeldWert   Wert des Indexfeldes, nach dem gesucht werden soll
    * @param    {int}       numberOfResults Maximale Anzahl an Treffern, die gefunden werden koennen
    * @return   {Sord[]}                    Gibt die gefundenen Sords als Array zurueck
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

        //Suche ausfuehren
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
    * Aendere ausgeschriebenen Monat in Monatsnummer
    * @author   Erik Koehler - Weinrich
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

    /**
    * Pruefe, ob Verzeichnis in ELO existiert
    * @author   Erik Koehler - Weinrich
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
    * Aendert das Icon eines Sords
    * @author   Erik Koehler - Weinrich
    * @param    {int}   sordId  ObjId des Sords, dessen Icon geaendert werden soll
    * @param    {int}   iconId  Id des Icons, welches das Sord bekommen soll
    * @return   {bool}          True, wenn Icon erfolgreich geaendert wurde
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
    * Fuegt einen Wert in ein Indexfeld ein, auch wenn noch kein Wert dafuer in der DB steht.
    * @author   Erik Koehler - Weinrich
    * @param    {Sord}      sord            Sord, fuer das das Indexfeld beschrieben werden soll
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
    * @author   Erik Koehler - Weinrich
    * @param    {Sord}  sord        Sord, fuer das die Farbe geaendert werden soll
    * @param    {int}   colorId     Id des Icons, welches das Sord bekommen soll
    * @return   {bool}              True, wenn Farbe erfolgreich geaendert wurde
    */
    setSordColor: function(sord, colorId) {
		try {           
            //Pruefe, ob es eine NEUE Farbe ist
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
    * Erstelle neuen Eintrag fuer Indexfeld
    * @author   Erik Koehler - Weinrich
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
    * @author   Erik Koehler - Weinrich
    * @param    {int}       sordId  ObjId des Sords, fuer das ein Feed-Eintrag geschrieben werden soll
    * @param    {String}    text    Text des Feed-Eintrags
    * @return   {bool}            True, wenn Feed-Eintrag erfolgreich geschrieben wurde
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
    * Setze ein Mapfeld in einem Sord ueber dessen objId
    * @author   Erik Koehler - Weinrich
    * @param    {int}       sordId      ObjId des Sords, fuer das das Mapfeld gesetzt werden soll
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
    * Lade die Mapfeld-Werte eines Sords ueber den Namen des Mapfeldes
    * @author   Erik Koehler - Weinrich
    * @param    {int}       sordId      ObjId des Sords, fuer das das Mapfeld geladen werden soll
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
    * Lade die Indexfeld-Werte eines Sords ueber die ObjKeyId des Indexfeldes
    * @author   Erik Koehler - Weinrich
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
    * Lade die Indexfeld-Werte eines Sords ueber den Namen des Indexfeldes
    * @author   Erik Koehler - Weinrich
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
    * Setze den Wert eines Indexfeldes in einem Sord ueber die ObjKeyId des Indexfeldes
    * @author   Erik Koehler - Weinrich
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
    * Setze den Wert eines Indexfeldes in einem Sord ueber den Namen des Indexfeldes
    * @author   Erik Koehler - Weinrich
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
    * Lade alle Kind-Sords eines Eltern-Sords ueber dessen Id
    * @author   Erik Koehler - Weinrich
    * @param    {int}                           parentId    Eltern-Sord fuer das alle Kind-Sords geladen werden sollen
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
    * Lade alle Unterverzeichnisse eines Sords ueber dessen Id
    * @author   Erik Koehler - Weinrich
    * @param    {int}                           parentId    Sord, fuer das die Unterverzeichnisse geladen werden sollen
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
    * Gibt den Pfad eines Sords ueber seine ID zuruec
    * @author   Erik Koehler - Weinrich
    * @param    {int}        sordId     Sord, fuer das der ELO-Pfad bestimmt werden soll
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
    * Gibt ein Sord ueber seinen Arc-Pfad zurueck
    * @author   Erik Koehler - Weinrich
    * @param    {String}    path    Vollstaendiger Pfad des zu ladenden Sords
    * @return   {Sord}              Sord, der ueber den Pfad geladen wurde
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
    * Gibt ein Sord ueber seinen relativen Arc-Pfad zurueck
    * @author   Erik Koehler - Weinrich
    * @param    {String}    path    Vollstaendiger Pfad des zu ladenden Sords
    * @return   {Sord}              Sord, der ueber den  relativen Arc-Pfad geladen wurde
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
    * Fuegt ein neues Verzeichnis ueber den uebergebenen Pfad in ELO hinzu und gibt dessen ObjId zurueck.
    * Der Pfad wird vollstaendig angelegt.
    * @author   Erik Koehler - Weinrich
    * @param    {String}    path    Vollstaendiger Pfad des zu ladenden Sords
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
    * Fuege ein neues Verzeichnis hinzu und gibt dessen ObjId zurueck
    * @author   Erik Koehler - Weinrich
    * @param    {int}       parentId    Verzeichnis, in das das neue Verzeichnis erstellt werden soll
    * @param    {String}    folderName  Name des neuen Verzeichnisses
    * @param    {String}    maskName    Name der Maske fuer das neue Verzeichnis
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
    * Prueft, ob das Sord eine Referenz ist
    * @author   Erik Koehler - Weinrich
    * @param    {int}    sordId     ObjId, des zu pruefenden Sords
    * @return   {bool}              True, wenn Sord eine Referenz ist. Bei Fehler gebe -1 zurueck
    */
    isReference: function (sordId) {
        
        try {    
            //Lade Sord ueber ObjId
            var sord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbAll, LockC.NO).sord;
            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);
    
            return Packages.de.elo.mover.utils.ELOAsSordUtils.isReference(emConnect, sord.id, sord.parentId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Pruefen, ob Sord " + sordId + " eine Referenz ist.\n" + ex);
            return -1;
        }
	},

    /**
    * Gibt das aktuelle DateTime ohne Zeit zurueck 
    * @author   Erik Koehler - Weinrich
    * @return   {Date}  Gibt das aktuelle Datum ohne Uhrzeit zurueck. Bei Fehler undefinded
    */
    getCurrentDate: function () {	
        try {    
		    return Packages.de.elo.mover.utils.ELOAsDateUtils.getDateWithoutTime(Packages.de.elo.mover.utils.ELOAsDateUtils.getToday());	
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des aktuellen Datums.\n" + ex);
            return undefined;
        }
    },

    /**
    * Gibt das heutige DateTime + x Minuten zurueck. Waehle negativen Wert bei minutes fuer - x Tage
    * @author   Erik Koehler - Weinrich
    * @return   {Date}  Um x Minuten verschobene Uhrzeit
    */
    getDateTimeMinutesLater: function(minutes) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.MINUTE, minutes);
        return cal.getTime();
    },
    
    /**
    * Gibt das heutige DateTime + x Stunden zurueck. Waehle negativen Wert bei hours fuer - x Stunden
    * @author   Erik Koehler - Weinrich
    * @return   {Date}  Um x Stunden verschobene Uhrzeit
    */
    getDateTimeHoursLater: function(hours) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.HOUR, hours);
        return cal.getTime();
    },
    
    /**
    * Gibt das heutige DateTime + x Tage zurueck. Waehle negativen Wert bei days fuer - x Tage
    * @author   Erik Koehler - Weinrich
    * @return   {Date}  Um x Minuten verschobene Uhrzeit
    */
    getDateTimeDaysLater: function(days) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.DAY, days);
        return cal.getTime();
    },

    /**
    * Gibt das heutige DateTime + x Monate zurueck. Waehle negativen Wert bei months fuer - x Monate
    * @author   Erik Koehler - Weinrich
    * @return   {Date}  Um x Monate verschobene Uhrzeit
    */
    getDateTimeMonthsLater: function(months) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.MONTH, months);
        return cal.getTime();
    },

    /**
    * Gibt das heutige DateTime + x Jahre zurueck. Waehle negativen Wert bei years fuer - x Jahre
    * @author   Erik Koehler - Weinrich
    * @return   {Date}  Um x Jahre verschobene Uhrzeit
    */
    getDateTimeYearsLater: function(years) {		
        var cal = Calendar.getInstance(); 
        cal.add(Calendar.YEAR, years);
        return cal.getTime();
    },

    /**
    * Gibt zurueck, ob das erste Datum nach dem zweiten Datum liegt
    * @author   Erik Koehler - Weinrich
    * @return   {bool}  True, wenn erstes Datum nach dem zweiten Datum. Bsp.: 01.01.2000 > 01.01.1990 => true
    */
    dateIsLater: function (firstDate, secondDate) {	
        try {
            return Packages.de.elo.mover.utils.ELOAsDateUtils.isNewerThan(firstDate, secondDate);
        }
        catch (ex) {
            this.logging(true, "Fehler bei der Prüfung, ob ein Datum nach dem anderen liegt.\n" + ex);
            return undefined;
        }	
    },
    
    // # -----------------------------------------------------
};