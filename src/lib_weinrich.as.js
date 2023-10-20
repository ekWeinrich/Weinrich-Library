//Java-Pakete
importPackage(Packages.org.apache.commons.io);

//ELO-Pakete
importPackage(Packages.de.elo.ix.client);

var weinrich = {};
weinrich.as = {};

/**
 * Allgemeine Funktionen
 * @memberof weinrich.as
 * @namespace weinrich.as.Utils
 * @type {object}
 * @version release 1.0.8
 * - {@link https://docs.oracle.com/javase/8/docs/api/java/util/ArrayList.html ArrayList}
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
        
        if (!this.logConfig.initialized) {
            log.info("\n\nInitialize Log-Config before logging.\n\n");    
            return undefined;
        }

        try {
            //Wenn hohe Priorität, dann schreibe ins Log, auch wenn Debug-Modus deaktiviert ist.
            if (highPriority || this.logConfig.debugMode) {
                log.info(this.logConfig.asRuleName + text);
            }
        }
        catch (ex) {
            log.info("\n\nLogging error ...\n" + ex + "\n");
        }
        return undefined;
    },	
    
    /**
    * Prueft, ob ein Array einen Wert enthält
    * @author   Erik Köhler - Weinrich
    * @param    {any[]}     arr     Array, in dem gesucht werden soll
    * @param    {any}       value   Wert, nach dem gesucht werden soll
    * @return   {bool}              Der übergebene Wert im Array gefunden wurde
    * @example
    * var arr = ["Fischer", "Caritas"];
    * var arrEnthaeltWert = weinrich.as.Utils.arrIncludes("Fischer");     
    */
    arrIncludes: function (arr, value) {
        
        if (!arr) false;
        
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == value)
                return true;
        }

        return false;
    },

    /**
    * Importiert eine Datei in ELO.
    * @author   Erik Köhler - Weinrich
    * @param    {File}      file            File der zu importierenden Datei
    * @param    {int}       sordId          ObjId des Sords, in das die Datei importiert werden soll
    * @param    {String}    maskName        Name der Maske, welche die Datei in ELO bekommen soll
    * @param    {Object}    objKeysObj      Indexfelder mit Werten, welche das Dokument bekommen soll
    * @param    {String}    corruptFileDest Zielordner in den korrupte Dateien verschoben werden, welche nicht importiert werden können
    * @return   {int}                       ObjId des neuen Sords
    * @example
    * var file = new File("C:\\temp\\tmp\\tmp1.pdf");
    * var sordId = 10186;
    * var maskId = "Freie Eingabe";
    * var objKeys = { "ELOSTATUS": "Imported" };
    * var corruptFileDest = "C:\\temp\\tmp\\Failed\\";
    * var newObjId = weinrich.as.Utils.importDocument(file, sordId, maskId, objKeys, corruptFileDest);
    */
    importDocument: function (file, sordId, maskName, objKeysObj, corruptFileDest) {
                
        try {        
            var fileName = file.name;
            
            this.logging(false, "Importiere: " + fileName);

            //Pruefe, ob die angegebene Datei existiert
            if (!weinrich.as.FileUtils.fileOrDirectoryExists(file)) {
                this.logging(false, "Datei wurde nicht gefunden...");
                return -1;
            }

            //Verschiebe korrupte Dateien in den angegebenen Ordner
            if (FileUtils.sizeOf(file) <= 10) {
                this.logging(false, "Fehlerhafte Datei erkannt (" + fileName + ")...");

                if (corruptFileDest && corruptFileDest.length > 0) {
                    this.logging(false, "Verschiebe die Datei in den Ordner für fehlgeschlagene Dateien...");
                                        
                    try {
                        var failedFolder = new File(corruptFileDest);
                        weinrich.as.FileUtils.moveFileToDir(file, failedFolder, true);
                    }
                    catch (e) {
                        this.logging(true, "Fehler beim verschieben der fehlerhaften Datei " + fileName + "\n" + e);                    
                    }
                }

                return -1;
            }

            this.logging(false, "Dateiname ist " + fileName.length() + " Zeichen lang...");

            //Schneide ab 128 Zeichen ab, da man sonst in einen Fehler läuft
            if (fileName.length() > 127) {
                fileName =  fileName.substring(0,127);
                this.logging(false, "Dateiname ist länger als 128 Zeichen. Er wurde gekürzt...");
            }
            
            objKeysObj[DocMaskLineC.NAME_FILENAME] = fileName;

            var ed = ixConnect.ix().createDoc(sordId, maskName, null, EditInfoC.mbSordDocAtt);
            ed.sord.name = fileName;

            var key;
            for (key in objKeysObj) {
                ix.setIndexValueByName(ed.sord, key, objKeysObj[key]);
            }

            var objKeys = Array.prototype.slice.call(ed.sord.objKeys);
            // objKeys.push(this.createObjKey(DocMaskLineC.ID_FILENAME, DocMaskLineC.NAME_FILENAME, file.name));
            objKeys.push(this.createObjKey(DocMaskLineC.ID_FILENAME, DocMaskLineC.NAME_FILENAME, fileName));
            ed.sord.objKeys = objKeys; 

            ed.document.docs = [new DocVersion()];
            ed.document.docs[0].ext = fu.getExt(file);
            ed.document.docs[0].pathId = ed.sord.path;
            ed.document.docs[0].encryptionSet = ed.sord.details.encryptionSet;
            ed.document = ixConnect.ix().checkinDocBegin(ed.document);
            ed.document.docs[0].uploadResult = ixConnect.upload(ed.document.docs[0].url, file);
            ed.document = ixConnect.ix().checkinDocEnd(ed.sord, SordC.mbAll, ed.document, LockC.NO);

            this.logging(false, file.name + " wurde erfolgreich importiert.");

            return ed.document.objId;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Importieren der Datei " + file.name + "\n" + ex);
            
            return -1;
        }
    },
    
    /**
    * Ändere die Kurzbezeichnung des Sords
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId des Sords
    * @param    {String}    shortname   Neue Kurzbezeichnung
    * @return   {Sord}                  Gibt das geänderte Sord zurück
    * @version added 1.1.0 
    */
    changeShortname: function (sordId, shortname) {
            
        try {    
            var currentSord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbSord, LockC.NO).sord; 
            currentSord.name = shortname;
            ixConnect.ix().checkinSord(currentSord, SordC.mbAll, LockC.NO);
            return currentSord;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Ändern der Kurzbezeichnung des Sords (" + sordId + ").\n" + ex);
            return undefined;
        }
    },

    /**
    * Ändere die Maske des Sords
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId des Sords
    * @param    {String}    maskName    Name oder Id der neuen Maske
    * @return   {Sord}                  Gibt das geänderte Sord zurück
    * @version added 1.0.8 
    */
    changeMask: function (sordId, maskName) {
            
        try {    
            var currentSord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbSord, LockC.NO).sord; 
            var changedSord = sol.common.SordUtils.changeMask(currentSord, maskName);
            ixConnect.ix().checkinSord(changedSord, SordC.mbAll, LockC.NO);
            return changedSord;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Ändern der Maske des Sords (" + sordId + ").\n" + ex);
            return undefined;
        }
    },

    /**
    * Benenne das Sord über die ObjId um.
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId, des zu umzubenennenden Sords
    * @param    {String}    name        Neue Kurzbezeichnung des Sords
    * @return   {bool}                  True, wenn erfolgreich umbenannt
    * @version added 1.0.1 
    */
    renameSordById: function (sordId, name) {
            
        try {    

            var sord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbAll, LockC.NO).sord;

            sord.name = name;

            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);

            return true;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Umbenennen des Sords " + sordId + " über seine Id.\n" + ex);
            return undefined;
        }
    },

    /**
    * Prüfe, ob diese Datei bereits in ELO existiert.
    * @author   Erik Köhler - Weinrich
    * @param    {File}   file   Pfad für die Datei/den Ordner, der zu prüfen ist
    * @return   {bool}          True wenn Datei bereits in ELO existiert
    */
	doubletExists: function (file) {
		
        return Packages.de.elo.mover.utils.ELOAsUtils.findDoublet(emConnect, file);
	},

    /**
    * Lösche Sord (markiere Sord als gelöscht).
    * @author   Erik Köhler - Weinrich
    * @param    {int}   sordId              ObjId des zu löschenden Sords
    * @param    {bool}  folderMustBeEmpty   Lösche nur einen Ordner, wenn dieser bereits leer ist
    * @return   {bool}                      True wenn Sord erfolgreich gelöscht wurde
    * @example
    * var sordId = 51970;
    * var folderMustBeEmpty = true;        
    * weinrich.as.Utils.deleteSord(sordId, folderMustBeEmpty);
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
    * Lösche Sord endgültig.
    * @author   Erik Köhler - Weinrich
    * @param    {int}   sordId              ObjId des zu löschenden Sords
    * @param    {bool}  folderMustBeEmpty   Lösche nur einen Ordner, wenn dieser bereits leer ist
    * @return   {bool}                      True wenn Sord erfolgreich gelöscht wurde
    * @example
    * var sordId = 51970;
    * var folderMustBeEmpty = true;        
    * weinrich.as.Utils.deleteSordFinally(sordId, folderMustBeEmpty);
    */
    deleteSordFinally: function(sordId, folderMustBeEmpty) {
        try {
            //Lädt Sord über die sordId
            var ed = ixConnect.ix().checkoutDoc(sordId, null, EditInfoC.mbSordDocAtt, LockC.NO);
            var sord = ed.sord;
            //Konfiguriere die Löschoptionen
            var delOptions = new DeleteOptions();
            //Lösche nur einen Ordner, wenn dieser bereits leer ist
            delOptions.folderMustBeEmpty = folderMustBeEmpty;
            try {
                //Markiere Sord als gelöscht
                ixConnect.ix().deleteSord(sord.getParentId(), sord.getId(), LockC.NO, delOptions);
                //Setze Flag zum endgültigen Löschen des Sords
                delOptions.deleteFinally = true;
                //Lösche das Sord endgülig, falls es leer ist oder folderMustBeEmpty=falses
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
    * @param    {int}   srcId       ObjId des zu verschiebenden Sords
    * @param    {int}   destId      ObjId des Verzeichnisses, in das das Sord verschoben werden soll
    * @return   {bool}              True wenn Elternverzeichnis gelöscht wurde, weil es leer wurde. Bei Fehler -1.
    * @example
    * var sordId = 10144;
    * var destId = 8713;                
    * weinrich.as.Utils.moveSordCleanUpAfter(sordId, destId);
    */
    moveSordCleanUpAfter: function(srcId, destId) {
		
        try {

            //Lade Sord über ObjId
            var sourceSord = this.getSordById(srcId);
            if (sourceSord === undefined) throw "Error loading Sord...";
                        
            //Verschiebe das Dokument in das passende Verzeichnis
            ixConnect.ix().copySord(destId, sourceSord.id, null, CopySordC.MOVE);

            //Lösche Eltern-Sord, wenn dieses nach dem Verschieben leer wurde
            return this.deleteSord(sourceSord.parentId, true);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Verschieben des Sords " + srcId + ".\n" + ex);
            return -1;            
        }
        
    },
    
    /**
    * Löscht das Sord in ELO. Wurde das Eltern-Verzeichnis dadurch komplett geleert, lösche es.
    * @author   Erik Köhler - Weinrich
    * @param    {int}   srcId       ObjId des zu löschenden Sords
    * @return   {bool}              True wenn Elternverzeichnis gelöscht wurde, weil es leer wurde
    * @example
    * var sordId = 10144;          
    * weinrich.as.Utils.deleteSordCleanUpAfter(sordId, destId);
    */
    deleteSordCleanUpAfter: function (srcId) {
        
        try {
            //Lade Sord über ObjId
            var sourceSord = this.getSordById(srcId);
            if (sourceSord === undefined) throw "Error loading Sord...";

            //Lösche Sord
            this.deleteSord(sourceSord.id, false);

            //Lösche Eltern-Sord, wenn dieses nach dem Löschen leer wurde
            return this.deleteSord(sourceSord.parentId, true);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Löschen des Sords " + srcId + ".\n" + ex);
            return -1;            
        }
	},

    /**
    * Lade das FindResult über die Suche nach Namen der Dokumente. Über die Maske einschränkbar.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    maskname        Name der Maske, falls danach gefiltert werden soll. Ansonsten ""
    * @param    {String}    docname         Kurzbezeichnung, nach der gesucht werden soll
    * @param    {int}       numberOfResults Maximale Anzahl an Treffern, die gefunden werden können
    * @return   {FindResult}                Gibt die gefundenen Sords als Array zurück
    * @example
    * var maskname = "Freie Eingabe";
    * var docname = "Dokument";
    * var numberOfResults = 100;       
    * var findResult = weinrich.as.Utils.getFindResultByDocName(maskname, docname, numberOfResults);
    */
    getFindResultByDocName: function(maskname, docname, numberOfResults) {
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
        
        return findResult;
    },

    /**
    * Suche nach Dokumenten über die Kurzbezeichnung. Über die Maske einschränkbar.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    maskname        Name der Maske, falls danach gefiltert werden soll. Ansonsten ""
    * @param    {String}    docname         Kurzbezeichnung, nach der gesucht werden soll
    * @param    {int}       numberOfResults Maximale Anzahl an Treffern, die gefunden werden können
    * @return   {Sord[]}                    Gibt die gefundenen Sords als Array zurück
    * @example
    * var maskname = "Freie Eingabe";
    * var docname = "Dokument";
    * var numberOfResults = 100;       
    * var sords = weinrich.as.Utils.getSordsByDocName(maskname, docname, numberOfResults);
    */
	getSordsByDocName: function(maskname, docname, numberOfResults) {
    
        var findResult = weinrich.as.Utils.getFindResultByDocName(maskname, docname, numberOfResults);
        var sords = findResult.getSords();

        return sords;
	},

    /**
    * Lade das FindResult über die Suche nach Werten eines Indexfeldes
    * @author   Erik Köhler - Weinrich
    * @param    {String}    maskname        Name der Maske, falls danach gefiltert werden soll
    * @param    {String}    indexfeldName   Indexfeld, in dem gesucht werden soll
    * @param    {String}    indexfeldWert   Wert des Indexfeldes, nach dem gesucht werden soll
    * @param    {int}       numberOfResults Maximale Anzahl an Treffern, die gefunden werden können
    * @return   {Sord[]}                    Gibt die gefundenen Sords als Array zurück
    * @example
    * var maskname = "MASKE";
    * var indexfeldName = "BETRIEB";
    * var indexfeldWert = "Weinrich";
    * var numberOfResults = 100;       
    * var findResult = weinrich.as.Utils.getFindResultByIndexfield(maskname, indexfeldName, indexfeldWert, numberOfResults);
    */
    getFindResultByIndexfield: function(maskname, indexfeldName, indexfeldWert, numberOfResults) {
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
        }
        catch(ex) {
            // ! Error beim Suchen mit Indexfeld
            this.logging(true, ex);
        }
        finally {
            if(findResult != null) {
                ixConnect.ix().findClose(findResult.getSearchId());
            }
        }
        
        return findResult;
    },

    /**
    * Lade die Sords über die Suche nach Werten eines Indexfeldes
    * @author   Erik Köhler - Weinrich
    * @param    {String}    maskname        Name der Maske, falls danach gefiltert werden soll
    * @param    {String}    indexfeldName   Indexfeld, in dem gesucht werden soll
    * @param    {String}    indexfeldWert   Wert des Indexfeldes, nach dem gesucht werden soll
    * @param    {int}       numberOfResults Maximale Anzahl an Treffern, die gefunden werden können
    * @return   {Sord[]}                    Gibt die gefundenen Sords als Array zurück
    * @example
    * var maskname = "MASKE";
    * var indexfeldName = "BETRIEB";
    * var indexfeldWert = "Weinrich";
    * var numberOfResults = 100;
    * var sords = weinrich.as.Utils.getSordsByIndexfield(maskname, indexfeldName, indexfeldWert, numberOfResults);
    */
    getSordsByIndexfield: function(maskname, indexfeldName, indexfeldWert, numberOfResults) {
		
        var findResult = this.getFindResultByIndexfield(maskname, indexfeldName, indexfeldWert, numberOfResults);
        var sords = findResult.getSords();
        
        return sords;
    },

    /**
    * Prüfe in ELO, ob in einem Verzeichnis ein Ordner mit der Kurzbezeichnung existiert
    * @author   Erik Köhler - Weinrich
    * @param    {int}       parentId    ObjId des Verzeichnisses, in dem nach der Kurzbezeichnung gesucht werden soll
    * @param    {String}    folderName  Kurzbezeichnung, welche gesucht werden soll
    * @return   {bool}                  True, wenn Kurzbezeichnung bereits in Verzeichnis existiert 
    * @example
    * var parentId = 12345;
    * var folderName = "Personalakten";
    * var folderExists = weinrich.as.Utils.checkFolderExistsInArchive(parentId, folderName);
    */
	checkFolderExistsInArchive: function(parentId, folderName) {
		
		//Lade das Elterverzeichnis
		var sords = Packages.de.elo.mover.utils.ELOAsUtils.getSubFolders(emConnect, parentId);
        if (sords === undefined) throw "Error loading Sords...";
				
        //Gehe alle Unterordner durch und suche nach der Kurzbezeichnung
		for(var i = 0; i < sords.length; i++) {
			var sord = sords[i];
			
			if(sord.name == folderName) {		
				return true;
			}
		}
		
		return false;
    },

    /**
    * Lade die ObjektId eines Ordners über dessen Kurzbezeichnung innerhalb eines Verzeichnisses
    * @author   Erik Köhler - Weinrich
    * @param    {int}       parentId    ObjId des Verzeichnisses, in dem nach der Kurzbezeichnung gesucht werden soll
    * @param    {String}    folderName  Kurzbezeichnung, welche gesucht werden soll
    * @return   {int}                   ObjId des gefundenen Ordners. Ansonsten -1.
    * @example
    * var parentId = 12345;
    * var folderName = "Personalakten";
    * var folderId = weinrich.as.Utils.getFolderIdFromParentByName(parentId, folderName);
    */
	getFolderIdFromParentByName: function(parentId, folderName) {
		
		//Lade das Elterverzeichnis
		var sords = Packages.de.elo.mover.utils.ELOAsUtils.getSubFolders(emConnect, parentId);
        if (sords === undefined) throw "Error loading Sords...";
				
        //Gehe alle Unterordner durch und suche nach der Kurzbezeichnung
		for(var i = 0; i < sords.length; i++) {
			var sord = sords[i];
			
			if(sord.name == folderName) {		
				return sord.id;
			}
		}
		
		return -1;
	},


    // TODO: SCHREIB MICH FERTIG
    // /**
    // * Prüfe in ELO, ob in einem Verzeichnis ein Ordner mit der Kurzbezeichnung existiert und gibt falls ja die Id des Sords zurück
    // * @author   Erik Köhler - Weinrich
    // * @param    {int}       parentId    ObjId des Verzeichnisses, in dem nach der Kurzbezeichnung gesucht werden soll
    // * @param    {String}    folderName  Kurzbezeichnung, welche gesucht werden soll
    // * @return   {Sord[]}                Gibt die gefundenen Sords als Array zurück
    // * @example
    // * var parentId = 12345;
    // * var folderName = "Personalakten";
    // * var folderExists = weinrich.as.Utils.checkFolderExistsInArchive(parentId, folderName);
    // */
	// getFolderByParentIdAndName: function(parentId, folderName) {
		
	// 	//Lade das Elterverzeichnis
	// 	var sords = Packages.de.elo.mover.utils.ELOAsUtils.getSubFolders(emConnect, parentId);
    //     if (sords === undefined) throw "Error loading Sords...";
				
    //     //Gehe alle Unterordner durch und suche nach der Kurzbezeichnung
	// 	for(var i = 0; i < sords.length; i++) {
	// 		var sord = sords[i];
			
	// 		if(sord.name == folderName) {		
	// 			return true;
	// 		}
	// 	}
		
	// 	return false;
	// },

    /**
    * Ändert das Icon eines Sords. Die IDs der Icons findet man in der Adminkonsole unter Eintragstypen.
    * @author   Erik Köhler - Weinrich
    * @param    {int}   sordId  ObjId des Sords, dessen Icon geändert werden soll
    * @param    {int}   iconId  ID des Icons, welches das Sord bekommen soll
    * @return   {bool}          True, wenn Icon erfolgreich geändert wurde
    * @example
    * var sordId = 12345;
    * var iconId = 22;
    * weinrich.as.Utils.setSordIcon(sordId, iconId);
    */
	setSordIcon: function(sordId, iconId) {
		
        try {
            var sordZ = new SordZ(SordC.mbId | SordC.mbType);
            var sord = ixConnect.ix().checkoutSord(sordId, sordZ, LockC.NO);
            if (sord === undefined) throw "Error loading Sord...";

            if (sord.type != iconId) {

                sord.type = iconId;
                
                this.logging(false, "Icon des Ordners  " + sordId + " geändert auf Eintragstyp mit der ID " + iconId);
            }

            ixConnect.ix().checkinSord(sord, sordZ, LockC.NO);

            return true;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Ändern des Icons für " + sordId + ".\n" + ex);
            return false;
        }		
	},

    /**
    * Fügt einen Wert in ein Indexfeld ein, auch wenn noch kein Wert dafür in der DB steht.
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId          SordId des Sords dessen Indexfeld beschrieben werden soll
    * @param    {String}    inputString     String, welcher in das Indexfeld geschrieben wird
    * @param    {String}    maskLineKey     Name des Indexfeldes
    * @param    {int}       maskLineId      Id des Indexfeldes. Siehe in der Maske nach z.B. "... (L3)" -> übergebe dann 3. 
    * @return   {bool}                      True, wenn Indexfeld erfolgreich beschrieben wurde
    * @example
    * var sordId = 43544;
    * var inputString = "String to insert";
    * var maskLineKey = "CONTRACT_NAME";
    * var maskLineId = 5;
    * weinrich.as.Utils.insertStringInIndexfield(sordId, inputString, maskLineKey, maskLineId);
    */
    insertStringInIndexfield: function (sordId, inputString, maskLineKey, maskLineId) {
        try {
			var tempSord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbAll, LockC.NO).sord;
			var objKeys = Array.prototype.slice.call(tempSord.objKeys);
			objKeys.push(this.createObjKey(--maskLineId, maskLineKey, inputString));
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
    * Setze die Schriftfarbe eines Sords. Die IDs der Farben findet man in der Adminkonsole unter Schriftfarben..
    * @author   Erik Köhler - Weinrich
    * @param    {int}   sordId       Sord ID des Sords, für das die Farbe geändert werden soll
    * @param    {int}   colorId     Id des Schriftfarbe, welches das Sord bekommen soll
    * @return   {bool}              True, wenn Farbe erfolgreich geändert wurde
    * @example
    * var sordId = 43544;
    * var colorId = 17;        
    * weinrich.as.Utils.setSordColor(sordId, colorId);
    */
    setSordColor: function(sordId, colorId) {
        try {    
            var sord = this.getSordById(sordId);
            if (sord === undefined) throw "Error loading Sord...";

            //Prüfe, ob es eine NEUE Farbe ist
			if (sord.kind != colorId) {
				
                //Setze die neue Farbe
				Packages.de.elo.mover.utils.ELOAsColorUtils.setColor(emConnect, [sord.id], colorId);
				
                this.logging(false, sord.name + " wurde umgefärbt. Neue FarbId = " + colorId);  
            }

            return true;
        }
        catch(ex) {
			this.logging(true, "Es ist ein Fehler beim Setzen der Farbe für " + sordId + " aufgetreten. " + ex);
            return false;
        }
	},

    /**
    * NUR für interne Funktionen dieser Bibliothek. Erstellt einen neuen Eintrag für ein Indexfeld.
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
    * @example
    * var sordId = 43544;
    * var text = "Dies ist ein Feed Eintrag.";        
    * weinrich.as.Utils.createFeedEntry(sordId, text);
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
    * Erstelle einen neuen dyn. Ordner mit den Suchoptionen aus dem FindResult in dem angegebenen Eltern-Verzeichnis
    * @author   Erik Köhler - Weinrich
    * @param    {int}           parentId    ObjId des Sords, für das ein Feed-Eintrag geschrieben werden soll
    * @param    {FindResult}    findResult  Suchergebnis, über das der dyn. Ordnerangelegt werden solgetSordByIdl
    * @return   {bool}                      True, wenn Feed-Eintrag erfolgreich geschrieben wurde
    * @example
    * var parentId = 43544;
    * var maskname = "CROSS-Belege";
    * var indexfeldName = "BETRIEB";
    * var indexfeldWert = "Weinrich";
    * var numberOfResults = 100;      
    * var dynFolderName = "Test dyn. Folder"; 
    * var findResult = weinrich.as.Utils.getFindResultByIndexfield(maskname, indexfeldName, indexfeldWert, numberOfResults);
    * weinrich.as.Utils.createDynFolderByFindResult(parentId, folderName, findResult);
    */
	createDynFolderByFindResult: function(parentId, folderName, findResult) {
        try {
            var json = weinrich.as.FilterUtils.getJSONStringByFindResult(findResult);

            var newFolderId = this.createFolderByParentId(parentId, folderName, "Ordner");

            var sord = ixConnect.ix().checkoutSord(newFolderId, EditInfoC.mbAll, LockC.NO).sord;
            
            sord.desc = json
            
            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);

            return true;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Erstellen des dyn. Ordners in " + parentId + ".\n" + ex);
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
    * @example
    * var sordId = 43544;
    * var mapName = "NEW_MAPFIELD";
    * var mapValue = "Dies ist der neue Wert des Mapfeldes.";
    * weinrich.as.Utils.setMapValue(sordId, mapName, mapValue);
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
    * Lade die Mapfeld-Werte eines Sords über den Namen des Mapfeldes.
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId des Sords, für das das Mapfeld geladen werden soll
    * @param    {String}    mapName     Name des zu ladenden Mapfeldes
    * @return   {String}                Wert des Indexfeldes, bei Fehler undefined
    * @example
    * var sordId = 43544;
    * var mapName = "NEW_MAPFIELD";
    * var mapValue = weinrich.as.Utils.getMapValue(sordId, mapName);
    */
    getMapValue: function (sordId, mapName) {
        
        try {
            return String(Packages.de.elo.mover.utils.ELOAsSordUtils.getMapValues(emConnect, sordId, mapName)[0]);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Wertes eines Mapfeldes für " + sordId + ".\n" + ex);
            return undefined;
        }
	},

    /**
    * Setze Indexfeldwerte eines Sords über ein Objekt mit Indexfeldname zu Wert Zuordnungen.
    * @author   Erik Köhler - Weinrich
    * @param    {Sord}      sord        Sord, für den der Wert des Indexfelds gesetzt werden soll
    * @param    {Object}    objKeysObj  Name des Indexfeldes
    * @example
    * var sordId = 43544;
    * var objKeyId = { "Betrag": "399.99" };
    * weinrich.as.Utils.setIndexfieldValueByParamList(sordId, objKeysObj);
    */
    setIndexfieldValueByParamList: function (sordId, objKeysObj) {
            
        try {
            var sord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbAll, LockC.NO).sord;
            
            var paramKey;
            for (paramKey in objKeysObj) {

                var objKeys = sord.objKeys;
                for (var i = 0; i < objKeys.length; i++) {
                    var objKey = objKeys[i];
                    if (objKey.name == paramKey) {
                        objKey.data = [objKeysObj[paramKey]];
                        break;
                    }
                }
            }
            
            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Setzen des Wertes eines Indexfeldes für " + sord.id + ".\n" + ex);
            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);
        }
    },

    /**
    * Setze den Indexfeldwert eines Sords über den Namen des Indexfeldes.
    * @author   Erik Köhler - Weinrich
    * @param    {Sord}      sord                Sord, für den der Wert des Indexfelds gesetzt werden soll
    * @param    {String}    indexfieldName      Name des Indexfeldes
    * @param    {String}    indexfieldValue     Zu setzender Wert des Indexfeldes
    * @example
    * var sordId = 43544;
    * var indexfieldName = "Betrag";
    * var indexfieldValue = "499.99";
    * weinrich.as.Utils.setIndexfieldValueByName(sordId, indexfieldName, indexfieldValue);
    */
    setIndexfieldValueByName: function (sordId, objKeyName, objKeyValue) {
            
        try {
            var sord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbAll, LockC.NO).sord;
            
            var objKeys = sord.objKeys;
            for (var i = 0; i < objKeys.length; i++) {
                var key = objKeys[i];
                if (key.name == objKeyName) {
                    key.data = [objKeyValue];
                    break;
                }
            }

            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Setzen des Wertes eines Indexfeldes für " + sord.id + ".\n" + ex);
            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);
        }
    },

    /**
    * Lade die Indexfeld-Werte eines Sords über die ObjKeyId des Indexfeldes.
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ID des Sords, aus dem der Wert des Indexfelds geladen werden soll
    * @param    {int}       objKeyId    ObjKeyId des Indexfeldes
    * @return   {String}                Wert des Indexfeldes, bei Fehler undefined
    * @example
    * var sordId = 43544;
    * var objKeyId = 5;
    * var ixfValue = weinrich.as.Utils.getIndexfieldValueById(sordId, objKeyId);
    */
    getIndexfieldValueById: function (sordId, objKeyId) {
        
        try {

            var sord = this.getSordById(sordId);                
            if (sord === undefined) throw "Error loading Sord...";

            return String(Packages.de.elo.mover.utils.ELOAsSordUtils.getObjKeyData(sord, objKeyId)[0]);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Wertes eines Indexfeldes für " + sord.id + ".\n" + ex);
            return undefined;
        }
    },
    
    /**
    * Lade die Indexfeld-Werte eines Sords über den Namen des Indexfeldes.
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId              ID des Sords, aus dem der Wert des Indexfelds geladen werden soll
    * @param    {String}    objKeyGroupName     Name des Indexfeldes
    * @return   {String}                        Wert des Indexfeldes, bei Fehler undefined
    * @example
    * var sordId = 43544;
    * var objKeyGroupName = "CONTRACT_NAME";
    * var ixfValue = weinrich.as.Utils.getIndexfieldValueByName(sordId, objKeyGroupName);
    */
    getIndexfieldValueByName: function (sordId, objKeyGroupName) {
        
        try {

            var sord = this.getSordById(sordId);            
            if (sord === undefined) throw "Error loading Sord...";
                
            return String(Packages.de.elo.mover.utils.ELOAsSordUtils.getObjKeyData(sord, objKeyGroupName)[0]);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Wertes eines Indexfeldes für " + sordId + ".\n" + ex);
        }        
    },
    
    /**
    * Lade alle Kind-Sords eines Eltern-Sords über dessen Id.
    * @author   Erik Köhler - Weinrich
    * @param    {int}                           parentId    Eltern-SordId für das alle Kind-Sords geladen werden sollen
    * @return   {java.util.ArrayList<Sord>}                 Alle Kind-Sords des Eltern-Sords
    * @example
    * var sordId = 43524;        
    * var childSords = weinrich.as.Utils.getChildSordsById(sordId);
    */
    getChildSordsById: function (parentId) {	
        
        try {
            return Packages.de.elo.mover.utils.ELOAsSordUtils.getChildren(emConnect, parentId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden aller Kind-Sords von  " + parentId + ".\n" + ex);
            return undefined;
        }
	},

    /**
    * Lade alle Kind-Sords eines Eltern-Sords über dessen Pfad.
    * @author   Erik Köhler - Weinrich
    * @param    {String}                        path    ELO-Pfad des Sords
    * @return   {java.util.ArrayList<Sord>}             Alle Kind-Sords des Eltern-Sords
    * @example
    * var sordId = 43524;
    * var path = weinrich.as.Utils.getArcPathById(sordId);
    * var childSords = weinrich.as.Utils.getChildSordsByPath(path);
    */
    getChildSordsByPath: function (path) {	
            
        try {
            var sord = this.getSordByArcpath(path);
            if (sord === undefined) throw "Error loading Sord...";

            return Packages.de.elo.mover.utils.ELOAsSordUtils.getChildren(emConnect, sord.parentId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden aller Kind-Sords von  " + path + ".\n" + ex);
            return undefined;
        }
    },

    /**
    * Lade alle Unterverzeichnisse eines Sords über dessen Id.
    * @author   Erik Köhler - Weinrich
    * @param    {int}                           parentId    Sord, für das die Unterverzeichnisse geladen werden sollen
    * @return   {java.util.ArrayList<Sord>}                 Alle Unterverzeichnisse des Sords
    * @example
    * var sordId = 43524;        
    * var childFolderSords = weinrich.as.Utils.getChildFolderSordsById(sordId);
    */
    getChildFolderSordsById: function (parentId) {		
        
        try {
            return Packages.de.elo.mover.utils.ELOAsUtils.getSubFolders(emConnect, parentId);	
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden der Unterverzeichnisse von  " + parentId + ".\n" + ex);
            return undefined;
        }
	},

    /**
    * Lade alle Unterverzeichnisse eines Sords über dessen Pfad.
    * @author   Erik Köhler - Weinrich
    * @param    {String}                        path    ELO-Pfad des Sords
    * @return   {java.util.ArrayList<Sord>}             Alle Unterverzeichnisse des Sords
    * @example
    * var sordId = 43524;
    * var path = weinrich.as.Utils.getArcpathById(sordId);
    * var childFolderSords = weinrich.as.Utils.getChildFolderSordsByPath(path);
    */
    getChildFolderSordsByPath: function (path) {		
        
        try {
            var sord = this.getSordByArcpath(path);
            if (sord === undefined) throw "Error loading Sord...";

            return Packages.de.elo.mover.utils.ELOAsUtils.getSubFolders(emConnect, sord.parentId);	
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden der Unterverzeichnisse von  " + path + ".\n" + ex);
            return undefined;
        }
	},

    /**
    * Gibt den Pfad eines Sords über seine ID zurück. Führend mit Namen des Archivs.
    * @author   Erik Köhler - Weinrich
    * @param    {int}        sordId     Sord, für das der ELO-Pfad bestimmt werden soll
    * @return   {String}                ELO-Pfad des Sords
    * @example
    * var sordId = 4907; 
    * var path = weinrich.as.Utils.getArcpathById(sordId);
    */
    getArcpathById: function (sordId) {	
        try {
            return String(Packages.de.elo.mover.utils.ELOAsUtils.getElementPath(emConnect, sordId));
        }
        catch (ex) {
            this.logging(true, "Fehler beim Bestimmen des ELO-Pfades von Sord " + sordId + ".\n" + ex);
            return undefined;
        }
    },
    
    /**
    * Gibt den ELO-Pfad des Eltern-Sords an, indem das Kind-Sord aus dem Pfad abgeschnitten wird.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Pfad des Kind-Sords
    * @return   {String}            Pfad des Eltern-Sords
    * @example
    * var sordId = 4907; 
    * var path = weinrich.as.Utils.getArcpathById(sordId);
    * var parentPath = weinrich.as.Utils.getParentArcpathByPath(path);
    */
    getParentArcpathByPath: function (path) {	

        try {

            var eloPath = this.convertArcpathToELOPath(path); 
            if (eloPath === undefined) throw "Error converting path...";
                
            if (eloPath.endsWith("¶"))
                eloPath = eloPath.substring(0, eloPath.length - 1);

            var splitPathArr = eloPath.split("¶");
            var newEloPath = "";
            
            for (var i = 0; i < (splitPathArr.length-1); i++){
                newEloPath += splitPathArr[i] + "¶";
                newEloPath = newEloPath.replace("¶¶", "¶");
            }

            return String(newEloPath);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Bestimmen des ELO-Pfades des Eltern-Sords von " + path + ".\n" + ex);
            return undefined;
        }
    },

    /**
    * Gibt ein Sord über seinen Arc-Pfad zurück.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Vollständiger Pfad des zu ladenden Sords. 
    *                               Akzeptiert Format "Archivname//T1 Schulung//000 Documents" und Format "¶T1 Schulung¶000 Documents".
    * @return   {Sord}              Sord, der über den Pfad geladen wurde. Bei Fehler wird undefined zurückgegeben.
    * @example
    * var sordId = 4907; 
    * var path = weinrich.as.Utils.getArcpathById(sordId); //Gibt etwas wie "Archivname//T1 Schulung//000 Documents" zurück
    * var sord = weinrich.as.Utils.getSordByArcpath(path); //Akzeptiert Format "Archivname//T1 Schulung//000 Documents" und Format "¶T1 Schulung¶000 Documents"
    */ 
    getSordByArcpath: function (path) {	

        return this.getSordByRelativeArcpath(path);
        // try {

        //     var eloPath = this.convertArcpathToELOPath(path); 
        //     if (eloPath === undefined) throw "Error converting path...";

        //     return Packages.de.elo.mover.utils.ELOAsUtils.getElemByArcpathRelative(emConnect, 1, eloPath);	
        // }
        // catch (ex) {
        //     this.logging(true, "Fehler beim Laden eines Sords über seinen Arc-Pfad. " + path + ".\n" + ex);
        // }

        // return undefined;
    },

    /**
    * Gibt ein Sord über seinen relativen Arc-Pfad zurück. Standard für Archiv: rootId=1.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Vollständiger Pfad des zu ladenden Sords
    * @param    {int}       rootId  ObjID des Sords, von dem aus der Pfad beginnen soll. Wurde es nicht angegeben, beginne aus Archivverzeichnis.
    * @return   {Sord}              Sord, der über den  relativen Arc-Pfad geladen wurde
    * @example
    * var rootId = 4907; 
    * var relativePath = "//Ordner//Temp";
    * var sord1 = weinrich.as.Utils.getSordByRelativeArcpath(relativePath, rootId); //Relativer Pfad ab angegebenem Rootverzeichnis
    * var sord2 = weinrich.as.Utils.getSordByRelativeArcpath(relativePath); //Relativer Pfad ab Archiv als Rootverzeichnis
    */
    getSordByRelativeArcpath: function (path, rootId) {		
        try {
            var eloPath = this.convertArcpathToELOPath(path); 
            if (eloPath === undefined) throw "Error converting path...";
            
            //Wurde KEINE ObjId als Rootverzeichnis angegeben, wird das Archiv als Rootverzeichnis gewählt
            if(rootId)
                return Packages.de.elo.mover.utils.ELOAsUtils.getElemByArcpathRelative(emConnect, rootId, eloPath);	
            else
                return Packages.de.elo.mover.utils.ELOAsUtils.getElemByArcpathRelative(emConnect, 1, eloPath);	
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden eines Sords über seinen relativen Arc-Pfad. " + eloPath + ".\n" + ex);
        }

        return undefined;
    },

    /**
    * Konvertiert einen Arc-Pfad in einen ELO-Pfad. Entfernt führende "ARCPATH:" bzw. Archivnamen und ersetzt "//" mit "¶".
    * Beispiel: "Archivname//T1 Schulung//000 Documents" zu "¶T1 Schulung¶000 Documents¶"
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Zu konvertierender Pfad (z.B.: "Archivname//T1 Schulung//000 Documents")
    * @return   {String}            Konvertierter Pfad (-> "¶T1 Schulung¶000 Documents¶")
    * @example
    * var sordId = 4907; 
    * var path = weinrich.as.Utils.getArcpathById(sordId); //Gibt etwas wie "Archivname//T1 Schulung//000 Documents" zurück
    * var eloPath = weinrich.as.Utils.convertArcpathToELOPath(path);
    */
    convertArcpathToELOPath: function(path) {
		
        try {
            eloPath = String(path);

            //Entferne das root-Verzeichnis aus dem Pfad
            if (eloPath.startsWith("ARCPATH:")) {
                eloPath = eloPath.replace("ARCPATH:", "");
            }

            //Entferne den Archivnamen aus dem Pfad
            var archiveName = this.getArchiveName();
            if (eloPath.startsWith(archiveName)) {
                eloPath = eloPath.replace(archiveName, "");
            }            
            
            //Ersetze alle // mit ¶, um einen validen ELO-Pfad zu erzeugen
            if (eloPath.indexOf("//") >= 0) {

                var splitPathArr = eloPath.split("//");
                var splitPath = "";
                
                for (var i = 0; i < splitPathArr.length; i++){
                    splitPath += splitPathArr[i] + "¶";
                    splitPath = splitPath.replace("¶¶", "¶");
                }
                eloPath = splitPath;
            }

            if (!eloPath.startsWith("¶")) { 
                eloPath = "¶" + eloPath;
            }
                        
            return eloPath;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Konvertieren des ELO-Pfades von " + path + " zu " + eloPath +  ".\n" + ex);
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
    createFolderByPath: function(path) {
		
        try {
            var eloPath = this.convertArcpathToELOPath(path);
            
            if (eloPath === undefined) throw "Error converting path...";
            
            return Packages.de.elo.mover.utils.ELOAsUtils.createArcPath(emConnect, 1, eloPath);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Erstellen des neuen Verzeichnisses. " + path + ".\n" + ex);
            return -1;
        }        
    },
    
    /**
    * Fügt ein neues Verzeichnis über den übergebenen Pfad in ELO hinzu und gibt dessen ObjId zurück.
    * Der Pfad wird vollständig angelegt.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Vollständiger Pfad des zu ladenden Sords
    * @param    {int}       rootId  
    * @return   {int}               ObjId des neu angelegten Verzeichnisses
    */
    createFolderByRelativePath: function(path, rootId) {
		
        try {
            var eloPath = this.convertArcpathToELOPath(path);

            if (eloPath === undefined) throw "Error converting path...";
                
            return Packages.de.elo.mover.utils.ELOAsUtils.createArcPath(emConnect, rootId, eloPath);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Erstellen des neuen Verzeichnisses. " + eloPath + ".\n" + ex);
         }
         
        return -1;
	},

    /**
    * Füge ein neues Verzeichnis hinzu und gibt dessen ObjId zurück
    * @author   Erik Köhler - Weinrich
    * @param    {int}       parentId    Verzeichnis, in das das neue Verzeichnis erstellt werden soll
    * @param    {String}    folderName  Name des neuen Verzeichnisses
    * @param    {String}    maskName    Name der Maske für das neue Verzeichnis
    * @return   {int}                   ObjId des neu angelegten Verzeichnisses
    */
    createFolderByParentId: function (parentId, folderName, maskName) {		
        
        try {            
		    return Packages.de.elo.mover.utils.ELOAsUtils.addNewFolder(emConnect, folderName, parentId, maskName);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Erstellen des neuen Verzeichnisses in " + parentId + ".\n" + ex);
            return -1;
        }
	},
	
    /**
    * Gibt den Namen des Archivs zurück
    * @author   Erik Köhler - Weinrich
    * @return   {String}    Name des Archivs
    */
    getArchiveName: function () {
            
        try {    
            return String(Packages.de.elo.mover.utils.ELOAsUtils.getArchiveName(emConnect));
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Namens des Archivs.\n" + ex);
            return undefined;
        }
    },

    /**
    * Lade Sord über die ObjId. Verwende CheckOut/CheckIn. Führt dies zu Zugriffs-Fehlern wird das Sord über den ermittelten Pfad geladen.
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId, des zu ladenden Sords
    * @return   {Sord}                  Geladenes Sord, ansonsten undefined
    */
    getSordById: function (sordId) {
        
        //Lade Sord mit checkout
        var sord = this.getSordWithCheckOutById(sordId);
        //Wurde Sord erfolgreich geladen, gebe es zurück
        if (sord != undefined)
            return sord;
        
        this.logging(true, "Versuche andere Alternative das Sord zu laden...");

        //Gab es einen Fehler mit checkout, versuche Sord über den Pfad zu laden
        sord = this.getSordWithPathById(sordId);
        //Wurde Sord erfolgreich geladen, gebe es zurück
        if (sord != undefined)
            return sord;
        
        //Konnte Sord mit beiden Methoden nicht geladen werden, gebe undefined zurück
        return undefined;
    },

    /**
    * Lade Sord über die ObjId. Verwende CheckOut/CheckIn. Führt dies zu Zugriffs-Fehlern sollte die andere Methode verwendet werden.
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId, des zu ladenden Sords
    * @return   {Sord}                  Geladenes Sord, ansonsten undefined
    */
    getSordWithCheckOutById: function (sordId) {
            
        try {    

            var sord = ixConnect.ix().checkoutSord(sordId, EditInfoC.mbAll, LockC.NO).sord;
            ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);

            return sord;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Sords " + sordId + " über seine Id.\n" + ex);
            return undefined;
        }
    },

    /**
    * Lade Sord über die ObjId. Verwendet den über die ObjId ermittelten Pfad. 
    * (Wahrscheinlich unperformanter als über CheckOut/CheckIn, aber ohne Zugriffsprobleme)
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      ObjId, des zu ladenden Sords
    * @return   {Sord}                  Geladenes Sord, ansonsten undefined
    */
    getSordWithPathById: function (sordId) {
            
        try {    
            
            var path = this.getArcpathById(sordId);
            var sord = this.getSordByArcpath(path);

            return sord;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Sords " + sordId + " über seine Id.\n" + ex);
            return undefined;
        }
    },

    /**
    * Prüft, ob das Sord eine Referenz ist über seine ObjId und die ObjId seines Eltern-Sords.
    * @author   Erik Köhler - Weinrich
    * @param    {int}    sordId     ObjId, des zu prüfenden Sords
    * @param    {int}    parentId   ObjId, des Eltern-Sords
    * @return   {bool}              True, wenn Sord eine Referenz ist. Bei Fehler gebe -1 zurück
    * @example
    * var sordId = 51977;
    * var path = weinrich.as.Utils.getArcpathById(sordId);
    * var parentPath = weinrich.as.Utils.getParentArcpathByPath(path);
    * var parentSord = weinrich.as.Utils.getSordByRelativeArcpath(parentPath);
    * var isReference = weinrich.as.Utils.isReferenceByIds(sordId, parentSord.id);
    */
    isReferenceByIds: function (sordId, parentId) {
        
        try {
            return Packages.de.elo.mover.utils.ELOAsSordUtils.isReference(emConnect, sordId, parentId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Prüfen, ob Sord " + sordId + " eine Referenz ist.\n" + ex);
            return -1;
        }
    },

    /**
    * Prüft, ob das Sord an der Stelle des übergebenen Pfades eine Referenz ist.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Pfad auf das Sord, welches überprüft werden soll, ob es eine Referenz ist
    * @return   {bool}              True, wenn Sord eine Referenz ist. Bei Fehler gebe -1 zurück
    * @example
    * var sordId = 51977;
    * var path = weinrich.as.Utils.getArcpathById(sordId);
    * var isReference = weinrich.as.Utils.isReferenceByPath(path);
    */
    isReferenceByPath: function (path) {
        
        try {    
            this.logging(false, "path=" + path);

            //Lade Sord über Pfad
            var sord = this.getSordByArcpath(path);   
            if (sord === undefined) throw "Error loading Sord...";

            //Generiere Pfad des Eltern-Sords über den Pfad des Kind-Sords
            var parentPath = this.getParentArcpathByPath(path);
            
            this.logging(false, "parentPath=" + parentPath);

            //Lade Eltern-Sord über den generierten Pfad
            var parentSord = this.getSordByArcpath(parentPath);   
            if (parentSord === undefined) throw "Error loading parent Sord...";
    
            return Packages.de.elo.mover.utils.ELOAsSordUtils.isReference(emConnect, sord.id, parentSord.id);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Prüfen, ob Sord " + sordId + " eine Referenz ist.\n" + ex);
            return -1;
        }
    },
    
    /**
    * Gibt alle Referenzen eines Sords über dessen ObjId zurück. Beinhaltet ebenfalls den Pfad auf das ursprüngliche Sord.
    * @author   Erik Köhler - Weinrich
    * @param    {int}       sordId      Sord, dessen Referenzen zurückgegeben werden sollen.
    * @return   {String[]}              Pfade auf die Referenzen. Gibt undefined bei Fehler zurück.
    * @example
    * var sordId = 51977;
    * var referencePaths = weinrich.as.Utils.getReferencePathsById(sordId);
    */
    getReferencePathsById: function (sordId) {
        
        try {        
            return Packages.de.elo.mover.utils.ELOAsUtils.getReferencePaths(emConnect, sordId);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden der Referenzen von  " + sordId + ".\n" + ex);
            return undefined;
        }
    },

    /**
    * Gibt alle Referenzen eines Sords über dessen Pfad zurück. Beinhaltet ebenfalls den Pfad auf das ursprüngliche Sord.
    * @author   Erik Köhler - Weinrich
    * @param    {String}    path    Pfad des Sords, dessen Referenzen zurückgegeben werden sollen.
    * @return   {String[]}          Pfade der Referenzen. Gibt undefined bei Fehler zurück.
    * @example
    * var sordId = 51977;
    * var path = weinrich.as.Utils.getArcpathById(sordId);
    * var referencePaths = weinrich.as.Utils.getReferencePathsByPath(path);
    */
    getReferencePathsByPath: function (path) {
        
        try {
            var sord = this.getSordByRelativeArcpath(path);
            if (sord === undefined) throw "Error loading Sord...";
             
            return Packages.de.elo.mover.utils.ELOAsUtils.getReferencePaths(emConnect, sord.id);
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden der Referenzen von  " + sordId + ".\n" + ex);
            return undefined;
        }
    },
     
    /**
    * Lade das Eltern-Sord über die ObjId eines Sords. Wird das Eltern-Sord einer Referenz gesucht, 
    * muss zusätzlich die rootId übergeben werden, ab der 
    * @author   Erik Köhler - Weinrich
    * @param    {int}    sordId     ObjId des Sords, dessen Eltern-Sord geladen werden soll
    * @param    {int}    rootId     Nur angeben wenn innerhalb eines Verzeichnisses nach dem Eltern-Sord einer REFERENZ gesucht werden soll 
    * @return   {Sord}              Eltern-Sord, ansonsten undefined
    * @example
    * var rootId = 51977; // ...//Schulung//000 Documents
    * var path = weinrich.as.Utils.getArcpathById(rootId) + "//xyz//T1_ELO ECM Suite 20 (PPT)";
    * var sord = weinrich.as.Utils.getSordByRelativeArcpath(path);
    * var parentRefSord1 = weinrich.as.Utils.getParentSordById(sord.id, rootId);    
    */
    getParentSordById: function(sordId, rootId) {

        //Gebe eine rootId an, wenn innerhalb eines Verzeichnisses nach dem Eltern-Sord einer REFERENZ gesucht werden soll
        if (rootId) {

            try {
                //Pfad, von dem aus nach Referenzen gesucht werden soll
                var rootPath = this.getArcpathById(rootId);
                this.logging(false, "rootPath= " + rootPath);
                if (rootPath === undefined) throw "Error loading rootPath...";

                //Pfade der Referenzen des Sords
                var referencePaths = this.getReferencePathsById(sordId);
                if (referencePaths === undefined) throw "Error loading referencePaths...";

                //Pfad auf eine (ab der rootId) eindeutige Referenz
                var foundReferencePath = undefined;

                //Gehe alle Referenzen durch und prüfe, ob der Pfad innerhalb des Rootverzeichnisses liegt
                for (var i = 0; i < referencePaths.length; i++) {

                    this.logging(false, "referencePath" + i + "=" + referencePaths[i]);
                    
                    //Prüfe, ob die Referenz innerhalb des Rootverzeichnisses liegt
                    if (referencePaths[i].contains(rootPath)) {
                        //Wurde bereits eine Referenz im Rootverzeichnis gefunden, ist das Ergebnis nicht mehr eindeutig
                        if (foundReferencePath)
                            throw "Es wurden mehrere Referenzen innerhalb des Rootverzeichnisses gefunden...";
                        else
                            foundReferencePath = referencePaths[i];
                    }
                }

                if (foundReferencePath) {
                    var parentSord = this.getSordByArcpath(foundReferencePath);
                    if (parentSord === undefined) throw "Error loading parent Sord...";
                }
                else
                    throw "Keine Referenz im Rootverzeichnis gefunden...";

                return parentSord;
            }
            catch (ex) {
                this.logging(true, "Fehler beim Laden des Eltern-Sords von " + sordId +
                    " innerhalb des Verzeichnisses " + rootId + ".\n" + ex);
                return undefined;
            }
        }
        else {
            try {

                var sord = this.getSordById(sordId);
                if (sord === undefined) throw "Error loading Sord...";

                var parentSord = this.getSordById(sord.parentId);
                if (parentSord === undefined) throw "Error loading parent Sord...";

                return parentSord;
            }
            catch (ex) {
                this.logging(true, "Fehler beim Laden des Eltern-Sords von " + sordId + ".\n" + ex);
                return undefined;
            }
        }      
    },
    
    /**
    * Lade das Eltern-Sord über die ObjId eines Sords. Wird das Eltern-Sord einer Referenz gesucht, 
    * muss zusätzlich die rootId übergeben werden, ab der 
    * @author   Erik Köhler - Weinrich
    * @param    {String}        path    Pfad des Sords, dessen Eltern-Sord geladen werden soll
    * @return   {Sord}                  Eltern-Sord, ansonsten undefined
    * @example
    * var rootId = 51977; // ...//Schulung//000 Documents
    * var path = weinrich.as.Utils.getArcpathById(rootId) + "//xyz//T1_ELO ECM Suite 20 (PPT)";
    * var parentSord = weinrich.as.Utils.getParentSordByPath(path);
    */
    getParentSordByPath: function(path) {

        try {
            
            var parentPath = this.getParentArcpathByPath(path);
            if (parentPath === undefined) throw "Error loading parent Path...";

            var parentSord = this.getSordByArcpath(parentPath);
            if (parentSord === undefined) throw "Error loading parent Sord...";

            return parentSord;
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Eltern-Sords von " + path + ".\n" + ex);
            return undefined;
        }
	},
    
    // # -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
};


/**
 * Funktionen um das Filtern zu vereinfachen
 * @memberof weinrich.as
 * @namespace weinrich.as.FilterUtils
 * @type {object}
 * @version release 1.0.0 
 */
 weinrich.as.FilterUtils = {
     
    /**
    * Gibt einen JSON-String zurück, der mit einer Suchabfrage generiert wurde. 
    * @author   Erik Köhler - Weinrich
    * @param    {FindResult}    findResult      Suchergebnis einer FindInfo Abfrage
    * @return   {String}                        JSON für den Zusatztext eines dyn. Ordners
    * @example
    * var maskname = "MASKE";
    * var indexfeldName = "BETRIEB";
    * var indexfeldWert = "Weinrich";
    * var numberOfResults = 100;       
    * var findResult = weinrich.as.Utils.getFindResultByIndexfield(maskname, indexfeldName, indexfeldWert, numberOfResults);
    * var dynFolderJSON = weinrich.as.FilterUtils.getJSONStringByFindResult(findResult);
    */
    getJSONStringByFindResult: function(findResult) {
       
        return findResult.dynamicFolder;
    },
     
    /**
    * Filtert die übergebene ArrayList nach Sords, dessen Kurzbezeichnung den Filterwert enthält.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    * @example
    * var sord = weinrich.as.Utils.getSordById(43532);        
    * var childSords = weinrich.as.Utils.getChildSordsById(sord.id);
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListByNameContains(childSords, "Mietvertrag");
    */
    filterArrayListByNameContains: function(sordArrList, filterValue) {
         
        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
         while (iterator.hasNext()) {   
            
            var sordArrListValue = iterator.next().name;    

            //Prüfe, ob der String, nach dem gefiltert werden soll, in der Kurzbezeichnung existiert
            if (!sordArrListValue.contains(filterValue)) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Filtert die übergebene ArrayList nach Sords, dessen Kurzbezeichnung dem Filterwert entspricht.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    * @example
    * var sord = weinrich.as.Utils.getSordById(43532);        
    * var childSords = weinrich.as.Utils.getChildSordsById(sord.id);
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListByNameEquals(childSords, "C000033 Mietvertrag");
    */
    filterArrayListByNameEquals: function(sordArrList, filterValue) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
         while (iterator.hasNext()) {   
            
            var sordArrListValue = iterator.next().name;    

            //Prüfe, ob der String, nach dem gefiltert werden soll, in der Kurzbezeichnung existiert
            if (sordArrListValue != filterValue) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Filtert die übergebene ArrayList nach Sords, dessen Kurzbezeichnung dem Regex entsprechen.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList         Zu filternde ArrayList (Java)
    * @param    {String}                    regex               Regex für die Kurzbezeichnung
    * @return   {java.util.ArrayList<Sord>}                     Gefilterte Arraylist
    * @example
    * var regEx = "(C[0-9]{6})";
    * var sord = weinrich.as.Utils.getSordById(43532);        
    * var childSords = weinrich.as.Utils.getChildSordsById(sord.id);
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListByNameRegex(childSords, regEx);
    */
    filterArrayListByNameRegex: function(sordArrList, regex) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {   
            
            var sordArrListValue = iterator.next().name;  

            //Prüfe, ob der Kurzbezeichnung dem Regex entspricht
            if (sordArrListValue.search(regex) == -1) {
                //Entferne Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Filtert die übergebene ArrayList nach Sords mit der uebergebenen Maske
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Maske, nach der gefiltert wird
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist                   Gefilterte Arraylist
    * @example
    * var sord = weinrich.as.Utils.getSordById(43532);
    * var contractSords = weinrich.as.FilterUtils.filterArrayListByMask(weinrich.as.Utils.getChildSordsById(sord.id), "Contract");
    */
    filterArrayListByMask: function(sordArrList, maskname) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
         while (iterator.hasNext()) {   
            
            var sordArrListValue = iterator.next().maskName;    

            //Prüfe, ob der String, nach dem gefiltert werden soll, in der Kurzbezeichnung existiert
            if (!sordArrListValue.contains(maskname)) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Filtert die übergebene ArrayList. Prüft, ob das Indexfeld einen Wert beinhaltet.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @param    {String}                    fieldToFilterWith      Name des Indexfeldes
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    * @example
    * var sord = weinrich.as.Utils.getSordById(43532);
    * var childSords = weinrich.as.FilterUtils.filterArrayListByMask(weinrich.as.Utils.getChildSordsById(sord.id), "Contract");
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListIndexfieldContains(childSords, "Mietvertrag", "CONTRACT_NAME");
    */
    filterArrayListIndexfieldContains: function(sordArrList, filterValue, fieldToFilterWith) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {            
            
            var sordArrListValue = weinrich.as.Utils.getIndexfieldValueByName(iterator.next().id, fieldToFilterWith);

            //Prüfe, ob der String, nach dem gefiltert werden soll, im Indexfeld existiert
            if (!sordArrListValue.contains(filterValue)) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Filtert die übergebene ArrayList. Prüft, ob das Indexfeld gleich einem Wert ist.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @param    {String}                    fieldToFilterWith      Name des Indexfeldes
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    * @example
    * var sord = weinrich.as.Utils.getSordById(43532);
    * var childSords = weinrich.as.FilterUtils.filterArrayListByMask(weinrich.as.Utils.getChildSordsById(sord.id), "Contract");
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListIndexfieldEquals(childSords,  "Mietverträge Seniorenwohnanlagen", "CONTRACT_TYPE");
    */
    filterArrayListIndexfieldEquals: function(sordArrList, filterValue, fieldToFilterWith) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {            
            
            var sordArrListValue = weinrich.as.Utils.getIndexfieldValueByName(iterator.next().id, fieldToFilterWith);

            if (sordArrListValue != filterValue) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Filtert die übergebene ArrayList. Prüft, ob das Indexfeld gleich Regex entspricht.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @param    {String}                    fieldToFilterWith      Name des Indexfeldes
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    * @example
    * var regEx = "(C[0-9]{6})";
    * var sord = weinrich.as.Utils.getSordById(43532);
    * var childSords = weinrich.as.FilterUtils.filterArrayListByMask(weinrich.as.Utils.getChildSordsById(sord.id), "Contract");
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListIndexfieldRegex(childSords, regEx, "CONTRACT_NAME");
    */
    filterArrayListIndexfieldRegex: function(sordArrList, filterValue, fieldToFilterWith) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {            
            
            var sordArrListValue = weinrich.as.Utils.getIndexfieldValueByName(iterator.next().id, fieldToFilterWith);

            if (sordArrListValue.search(filterValue) == -1) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },
    
    /**
    * Filtert die übergebene ArrayList. Prüft, ob das Mapfeld einen Wert beinhaltet.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @param    {String}                    fieldToFilterWith      Name des Mapfeldes
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    * @example
    * var sord = weinrich.as.Utils.getSordById(43532);
    * var childSords = weinrich.as.FilterUtils.filterArrayListByMask(weinrich.as.Utils.getChildSordsById(sord.id), "Contract");
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListMapfieldContains(childSords, "EUR", "CONTRACT_BASE_CURRENCY_CODE");
    */
    filterArrayListMapfieldContains: function(sordArrList, filterValue, fieldToFilterWith) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {            
            
            var sordArrListValue = weinrich.as.Utils.getMapValue(iterator.next().id, fieldToFilterWith);

            //Prüfe, ob der String, nach dem gefiltert werden soll, im Indexfeld existiert
            if (!sordArrListValue.contains(filterValue)) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Filtert die übergebene ArrayList. Prüft, ob das Mapfeld gleich einem Wert ist.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @param    {String}                    fieldToFilterWith      Name des Mapfeldes
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    * @example
    * var sord = weinrich.as.Utils.getSordById(43532);
    * var childSords = weinrich.as.FilterUtils.filterArrayListByMask(weinrich.as.Utils.getChildSordsById(sord.id), "Contract");
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListMapfieldEquals(childSords, "EUR", "CONTRACT_BASE_CURRENCY_CODE");
    */
    filterArrayListMapfieldEquals: function(sordArrList, filterValue, fieldToFilterWith) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {            
            
            var sordArrListValue = weinrich.as.Utils.getMapValue(iterator.next().id, fieldToFilterWith);

            if (sordArrListValue != filterValue) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },

    /**
    * Filtert die übergebene ArrayList. Prüft, ob das Mapfeld gleich Regex entspricht.
    * @author   Erik Köhler - Weinrich
    * @param    {java.util.ArrayList<Sord>} sordArrList            Zu filternde ArrayList (Java)
    * @param    {String}                    filterValue            Wert, nach dem gefiltert wird
    * @param    {String}                    fieldToFilterWith      Name des Mapfeldes
    * @return   {java.util.ArrayList<Sord>}                        Gefilterte Arraylist
    * @example
    * var regEx = "([0-9])";
    * var sord = weinrich.as.Utils.getSordById(43532);
    * var childSords = weinrich.as.FilterUtils.filterArrayListByMask(weinrich.as.Utils.getChildSordsById(sord.id), "Contract");
    * var filteredArrayList = weinrich.as.FilterUtils.filterArrayListMapfieldRegex(childSords, regEx, "CONTRACT_MIN_TERM");
    */
    filterArrayListMapfieldRegex: function(sordArrList, filterValue, fieldToFilterWith) {

        //Erstelle einen Iterator für die ArrayList mit Sords
        var iterator = sordArrList.iterator();

        //Iteriere durch alle Elemente
        while (iterator.hasNext()) {            
            
            var sordArrListValue = weinrich.as.Utils.getMapValue(iterator.next().id, fieldToFilterWith);

            if (sordArrListValue.search(filterValue) == -1) {
                //Entferne bei Sord aus der ArrayList
                iterator.remove();
            }
        }

        return sordArrList;
    },
};

/**
 * Funktionen für Zeit und Datum. Nutzt u.a. Funktionen von:  
 * - {@link https://docs.oracle.com/javase/8/docs/api/java/util/Date.html Date}
 * - {@link https://docs.oracle.com/javase/7/docs/api/java/util/Calendar.html Calendar}
 * @memberof weinrich.as
 * @namespace weinrich.as.DateUtils
 * @type {object}
 * @version release 1.0.0 
 */
weinrich.as.DateUtils = {

    /**
    * Konvertiert den übergebenen ISO-Datum-String in ein Date Objekt und gibt diese zurück
    * @author   Erik Köhler - Weinrich
    * @param    {String}    date            Datum als String im ISO-Format
    * @param    {Boolean}   withoutTime     Gibt an, ob die Zeit genullt werden soll
    * @return   {Date}                      Konvertiertes Datum. Bei Fehler undefined.
    */
    convertIsoToDate: function (iso, withoutTime) {	
        try {

            if (!Packages.de.elo.mover.utils.ELOAsDateUtils.isValidIsoDate(iso)) {
                weinrich.as.Utils.logging(true, "Das ISO-Datum war nicht valide und konnte nicht konvertiert werden.\n" + ex);
                return undefined;
            }

            var newDate = Packages.de.elo.mover.utils.ELOAsDateUtils.dateFromIso(iso);	

            if(withoutTime)
                Packages.de.elo.mover.utils.ELOAsDateUtils.getDateWithoutTime(newDate);

            return newDate;
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Konvertieren des ISO-Datums.\n" + ex);
            return undefined;
        }
    },

    /**
    * Konvertiert das übergebene Date-Objekt zu einem ISO-Datum-String und gibt diesen zurück
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date            Datum welches zu einem ISO-Datum konvertiert werden soll
    * @param    {Boolean}   withoutTime     Gibt an, ob die Zeit genullt werden soll
    * @return   {String}                    Konvertiertes ISO-Datum. Bei Fehler undefined.
    */
    convertDateToIso: function (date, withoutTime) {
        try {    
            if(withoutTime)
                return Packages.de.elo.mover.utils.ELOAsDateUtils.isoFromDateShort(date);
            
            return Packages.de.elo.mover.utils.ELOAsDateUtils.isoFromDate(date);            
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Konvertieren des Datums.\n" + ex);
            return undefined;
        }
    },

    /**
    * Gibt das aktuelle DateTime ohne Zeit zurück. Format bei Ausgabe: "Fri Dec 16 00:00:00 CET 2022".
    * @author   Erik Köhler - Weinrich
    * @return   {Date}                  Gibt das aktuelle Datum ohne Uhrzeit zurück. Bei Fehler undefined.
    * @example
    * var currentDate = weinrich.as.DateUtils.getCurrentDate();
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
    * Gibt das aktuelle DateTime mit Zeit zurück. Format bei Ausgabe: "Fri Dec 16 01:30:55 CET 2022".
    * @author   Erik Köhler - Weinrich
    * @return   {Date}                  Gibt das aktuelle Datum mit Uhrzeit zurück. Bei Fehler undefined.
    * @example
    * var currentDateTime = weinrich.as.DateUtils.getCurrentDateTime();
    */
    getCurrentDateTime: function () {	
        try {    
		    return Packages.de.elo.mover.utils.ELOAsDateUtils.getToday();	
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Laden des aktuellen Datums.\n" + ex);
            return undefined;
        }
    },

    /**
    * Formatiert das übergebene Datum in das deutsche Datumsformat (z.B.: 24.12.2022)
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date    Zu formatierendes DateTime
    * @return   {String}            Formatiertes Datum
    * @example
    * var currentDate = weinrich.as.DateUtils.getCurrentDate();
    * var formattedDate = weinrich.as.DateUtils.getFormattedDate(currentDate);
    */
    getFormattedDate: function (date) {	
        try {
            var calendar = Calendar.getInstance(); 
            calendar.setTime(date);

            var day = calendar.get(Calendar.DAY_OF_MONTH);
            var month = calendar.get(Calendar.MONTH) + 1;
            var year = calendar.get(Calendar.YEAR);

            var dateString = ('0' + day).slice(-2) + '.'
                + ('0' + month).slice(-2) + '.'
                + ('000' + year).slice(-4);

            return dateString;
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim formatieren des Datums.\n" + ex);
            return undefined;
        }
    },

    /**
    * Formatiert die übergebene Zeit in das deutsche Zeitformat (z.B.: 02:30:00 2 Uhr 30 Minuten 0 Sekunden)
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date    Zu formatierendes DateTime
    * @return   {String}            Formatierte Zeit
    * @example
    * var currentDate = weinrich.as.DateUtils.getCurrentDate();
    * var formattedTime = weinrich.as.DateUtils.getFormattedTime(currentDate);
    */
    getFormattedTime: function (date) {	

        try {   		
            var calendar = Calendar.getInstance(); 
            calendar.setTime(date);

            var seconds = calendar.get(Calendar.SECOND);
            var minutes = calendar.get(Calendar.MINUTE);
            var hours = calendar.get(Calendar.HOUR);

            var dateString = ('0' + hours).slice(-2) + ':'
                + ('0' + minutes).slice(-2) + ':'
                + ('0' + seconds).slice(-2);

            return dateString;
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Formatieren der Uhrzeit.\n" + ex);
            return undefined;
        }
    },
     
    /**
    * Formatiert das übergebene Datum in das deutsche Datumsformat (z.B.: 24.12.2022)
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date    Zu formatierendes Datum
    * @return   {String}            Formatiertes Datum
    * @example
    * var currentDate = weinrich.as.DateUtils.getCurrentDate();
    * var formattedDateTime = weinrich.as.DateUtils.getFormattedDateTime(currentDate);
    */
    getFormattedDateTime: function (date) {	
        try {   
            
            return (this.getFormattedTime(date) + " " + this.getFormattedDate(date));
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim formatieren der Uhrzeit mit Datum.\n" + ex);
            return undefined;
        }
    },

    /**
    * Ändert den Wert des DateTimes zu einem reinem Datum ohne Uhrzeit (Uhrzeit ist dann 00:00:00 Uhr). 
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date    Zu formatierendes DateTime
    * @return   {String}            Formatiertes Datum
    * @example
    * var currentDateTime = weinrich.as.DateUtils.getCurrentDateTime();
    * var currentDate = weinrich.as.DateUtils.getOnlyDateFromDateTime(currentDateTime);
    */
    getOnlyDateFromDateTime: function (date) {	
        try {
            var calendar = Calendar.getInstance(); 
            calendar.setTime(date);

            var day = calendar.get(Calendar.DAY_OF_MONTH);
            var month = calendar.get(Calendar.MONTH) + 1;
            var year = calendar.get(Calendar.YEAR);
            
            var onlyDate = new Date(year, month, day);            
            calendar.setTime(onlyDate);

            return calendar.getTime();
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Umwandeln des DateTimes zu einem reinen Datum.\n" + ex);
            return undefined;
        }
    },

    /**
    * (DO NOT USE) Rechnet Zeit auf das übergebene DateTime.
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date        DateTime als Ausgangswert
    * @param    {int}       timeEntity  Draufzurechnende Zeiteinheit (z.B. Anzahl zu addierender Minuten)
    * @return   {Date}                  DateTime mit aufaddierter Zeit
    */
    addTimeToDateTime: function(date, timeEntity, timetype) {		
        var calendar = Calendar.getInstance(); 
        calendar.setTime(date);
        calendar.add(timetype, timeEntity);
        return calendar.getTime();
    },
    
    /**
    * Rechnet die Anzahl Sekunden auf das übergebene DateTime. Wähle negativen Wert bei seconds für minus x Sekunden
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date        DateTime als Ausgangswert
    * @param    {int}       seconds     Anzahl zu addierender Sekunden
    * @return   {Date}                  DateTime mit aufaddierten Sekunden
    * @example
    * var now = weinrich.as.DateUtils.getCurrentDate();
    * var newDate = weinrich.as.DateUtils.addSecondsToDateTime(now, 10);
    */
    addSecondsToDateTime: function (date, seconds) {	
        return this.addTimeToDateTime(date, seconds, Calendar.SECOND);
    },

    /**
    * Gibt das jetzige DateTime plus x Sekunden zurück. Wähle negativen Wert bei seconds für minus x Sekunden
    * @author   Erik Köhler - Weinrich
    * @param    {int}       seconds     Anzahl zu addierender Sekunden
    * @return   {Date}                  Um x Sekunden verschobene jetziges DateTime
    */
    addSecondsToNow: function(seconds) {		
        var cal = Calendar.getInstance();
        return this.addSecondsToDateTime(cal.getTime(), seconds);
    }, 

    /**
    * Rechnet die Anzahl Minuten auf das übergebene DateTime. Wähle negativen Wert bei minutes für minus x Minuten
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date        DateTime als Ausgangswert
    * @param    {int}       minutes     Anzahl zu addierender Minuten
    * @return   {Date}                  DateTime mit aufaddierten Minuten
    * @example
    * var now = weinrich.as.DateUtils.getCurrentDate();
    * var newDate = weinrich.as.DateUtils.addMinutesToDateTime(now, 10);
    */
    addMinutesToDateTime: function (date, minutes) {	
        return this.addTimeToDateTime(date, minutes, Calendar.MINUTE);
    },

    /**
    * Gibt das jetzige DateTime plus x Minuten zurück. Wähle negativen Wert bei minutes für minus x Minuten
    * @author   Erik Köhler - Weinrich
    * @param    {int}       minutes     Anzahl zu addierender Minuten
    * @return   {Date}                  Um x Minuten verschobene jetziges DateTime
    */
    addMinutesToNow: function(minutes) {		
        var cal = Calendar.getInstance();
        return this.addMinutesToDateTime(cal.getTime(), minutes);
    },    

    /**
    * Rechnet die Anzahl Stunden auf das übergebene DateTime. Wähle negativen Wert bei hours für minus x Stunden
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date        DateTime als Ausgangswert
    * @param    {int}       hours       Anzahl zu addierender Stunden
    * @return   {Date}                  DateTime mit aufaddierten Stunden
    * @example
    * var now = weinrich.as.DateUtils.getCurrentDate();
    * var newDate = weinrich.as.DateUtils.addHoursToDateTime(now, 10);
    */
    addHoursToDateTime: function(date, hours) {	
        return this.addTimeToDateTime(date, hours, Calendar.HOUR);
    },

    /**
    * Gibt das jetzige DateTime plus x Stunden zurück. Wähle negativen Wert bei hours für minus x Stunden
    * @author   Erik Köhler - Weinrich
    * @param    {int}       hours     Anzahl zu addierender Stunden
    * @return   {Date}                  Um x Stunden verschobene jetziges DateTime
    */
    addHoursToNow: function(hours) {		
        var cal = Calendar.getInstance();
        return this.addHoursToDateTime(cal.getTime(), hours);
    },    

    /**
    * Rechnet die Anzahl Tage auf das übergebene DateTime. Wähle negativen Wert bei days für minus x Tage
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date        DateTime als Ausgangswert
    * @param    {int}       days        Anzahl zu addierender Tage
    * @return   {Date}                  DateTime mit aufaddierten Tage
    * @example
    * var now = weinrich.as.DateUtils.getCurrentDate();
    * var newDate = weinrich.as.DateUtils.addDaysToDateTime(now, 10);
    */
    addDaysToDateTime: function(date, days) {	
        return this.addTimeToDateTime(date, days, Calendar.DAY_OF_MONTH);
    },

    /**
    * Gibt das jetzige DateTime plus x Tage zurück. Wähle negativen Wert bei days für minus x Tage
    * @author   Erik Köhler - Weinrich
    * @param    {int}       days    Anzahl zu addierender Tage
    * @return   {Date}              Um x Tage verschobene jetziges DateTime
    */
    addDaysToNow: function(days) {		
        var cal = Calendar.getInstance();
        return this.addDaysToDateTime(cal.getTime(), days);
    },       

    /**
    * Rechnet die Anzahl Wochen auf das übergebene DateTime. Wähle negativen Wert bei weeks für minus x Wochen
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date        DateTime als Ausgangswert
    * @param    {int}       weeks       Anzahl zu addierender Wochen
    * @return   {Date}                  DateTime mit aufaddierten Wochen
    * @example
    * var now = weinrich.as.DateUtils.getCurrentDate();
    * var newDate = weinrich.as.DateUtils.addWeeksToDateTime(now, 10);
    */
    addWeeksToDateTime: function(date, weeks) {	
        return this.addTimeToDateTime(date, (weeks*7), Calendar.DAY_OF_MONTH);
    },

    /**
    * Gibt das jetzige DateTime plus x Wochen zurück. Wähle negativen Wert bei weeks für minus x Wochen
    * @author   Erik Köhler - Weinrich
    * @param    {int}       weeks    Anzahl zu addierender Wochen
    * @return   {Date}              Um x Wochen verschobene jetziges DateTime
    */
    addWeeksToNow: function(weeks) {		
        var cal = Calendar.getInstance();
        return this.addDaysToDateTime(cal.getTime(), (weeks*7));
    },    

    /**
    * Rechnet die Anzahl Monate auf das übergebene DateTime. Wähle negativen Wert bei months für minus x Monate
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date        DateTime als Ausgangswert
    * @param    {int}       months      Anzahl zu addierender Monate
    * @return   {Date}                  DateTime mit aufaddierten Monate
    * @example
    * var now = weinrich.as.DateUtils.getCurrentDate();
    * var newDate = weinrich.as.DateUtils.addMonthsToDateTime(now, 10);
    */
    addMonthsToDateTime: function(date, months) {	
        return this.addTimeToDateTime(date, months, Calendar.MONTH);
    },

    /**
    * Gibt das jetzige DateTime plus x Monate zurück. Wähle negativen Wert bei months für minus x Monate
    * @author   Erik Köhler - Weinrich
    * @param    {int}       months  Anzahl zu addierender Monate
    * @return   {Date}              Um x Monate verschobene jetziges DateTime
    */
    addMonthsToNow: function(months) {		
        var cal = Calendar.getInstance();
        return this.addMonthsToDateTime(cal.getTime(), months);
    },   

    /**
    * Rechnet die Anzahl Jahre auf das übergebene DateTime. Wähle negativen Wert bei years für minus x Jahre
    * @author   Erik Köhler - Weinrich
    * @param    {Date}      date        DateTime als Ausgangswert
    * @param    {int}       years       Anzahl zu addierender Jahre
    * @return   {Date}                  DateTime mit aufaddierten Jahre
    * @example
    * var now = weinrich.as.DateUtils.getCurrentDate();
    * var newDate = weinrich.as.DateUtils.addYearsToDateTime(now, 10);
    */
    addYearsToDateTime: function(date, years) {	
        return this.addTimeToDateTime(date, years, Calendar.YEAR);
    },

    /**
    * Gibt das jetzige DateTime plus x Jahre zurück. Wähle negativen Wert bei years für minus x Jahre
    * @author   Erik Köhler - Weinrich
    * @param    {int}       years   Anzahl zu addierender Jahre
    * @return   {Date}              Um x Jahre verschobene jetziges DateTime
    */
    addYearsToNow: function(years) {		
        var cal = Calendar.getInstance();
        return this.addYearsToDateTime(cal.getTime(), years);
    },

    /**
    * Gibt zurück, ob das erste Datum nach dem zweiten Datum liegt
    * @author   Erik Köhler - Weinrich
    * @return   {bool}  True, wenn erstes Datum nach dem zweiten Datum. Bsp.: 01.01.2000 > 01.01.1990 => true
    */
    dateIsAfter: function (firstDate, secondDate) {	
        try {
            var date1 = this.getOnlyDateFromDateTime(firstDate);
            var date2 = this.getOnlyDateFromDateTime(secondDate);

            return (date1 > date2);
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler bei der Prüfung, ob ein Datum nach dem anderen liegt.\n" + ex);
            return undefined;
        }	
    },

    /**
    * Gibt zurück, ob das erste Datum nach dem zweiten Datum liegt
    * @author   Erik Köhler - Weinrich
    * @return   {bool}  True, wenn erstes Datum nach dem zweiten Datum. Bsp.: 01.01.2000 > 01.01.1990 => true
    */
    dateIsEqualOrAfter: function (firstDate, secondDate) {	
        try {
            var date1 = this.getOnlyDateFromDateTime(firstDate);
            var date2 = this.getOnlyDateFromDateTime(secondDate);

            return (date1 >= date2);
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler bei der Prüfung, ob ein Datum nach dem anderen liegt.\n" + ex);
            return undefined;
        }	
    },

    /**
    * Gibt zurück, ob das erste Datum nach dem zweiten Datum liegt
    * @author   Erik Köhler - Weinrich
    * @return   {bool}  True, wenn erstes Datum nach dem zweiten Datum. Bsp.: 01.01.2000 > 01.01.1990 => true
    */
    dateIsBefore: function (firstDate, secondDate) {	
        try {
            var date1 = this.getOnlyDateFromDateTime(firstDate);
            var date2 = this.getOnlyDateFromDateTime(secondDate);

            return (date1 < date2);
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler bei der Prüfung, ob ein Datum vor dem anderen liegt.\n" + ex);
            return undefined;
        }	
    },
    
    /**
    * Gibt zurück, ob das erste Datum nach dem zweiten Datum liegt
    * @author   Erik Köhler - Weinrich
    * @return   {bool}  True, wenn erstes Datum nach dem zweiten Datum. Bsp.: 01.01.2000 > 01.01.1990 => true
    */
    dateIsEqualOrBefore: function (firstDate, secondDate) {	
        try {
            var date1 = this.getOnlyDateFromDateTime(firstDate);
            var date2 = this.getOnlyDateFromDateTime(secondDate);

            return (date1 <= date2);
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler bei der Prüfung, ob ein Datum vor dem anderen liegt.\n" + ex);
            return undefined;
        }	
    },

    /**
    * Ändere ausgeschriebenen Monat in Monatsnummer.
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
 * Funktionen auf Dateiebene. Nutzt u.a. Funktionen von:  
 * - {@link https://commons.apache.org/proper/commons-io/apidocs/org/apache/commons/io/FileUtils.html FileUtils}
 * @memberof weinrich.as
 * @namespace weinrich.as.FileUtils
 * @type {object}
 * @version release 1.0.0 
 */
weinrich.as.FileUtils = {
     
    /**
    * Prüft, ob die Datei bzw. das Verzeichnis existiert.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   fileOrDirectoryExists
    * @param    {File}   file   Pfad für die Datei/den Ordner, der zu prüfen ist
    * @return   {bool}          True wenn Pfad existiert
    */
    fileOrDirectoryExists: function (file) {
            
        return file.exists();
    },

    /**
    * Gibt die Dateien mit den übergebenen Dateiendungen zurück.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   getFilesFromDirectory
    * @param    {String}    srcPath     Pfad des Ordners, aus dem die Dateien geladen werden sollen
    * @param    {String[]}  extensions  Dateiendungen, nach denen gefiltert wird. Z.B.: [".pdf"]
    * @param    {Boolean}   recursive   Legt fest, ob auch die Deatein aus den Unterordnern
    * @return   {File[]}                Gibt die Dateien mit den übergebenen Dateiendungen zurück. Undefined, wenn Pfad nicht existiert
    * @example
    *  var srcPath = "c:\\PdfOrdner";
    *  var extensions = ['.pdf'];
    *  var recursive = false;
    *  var files = weinrich.as.FileUtils.getFilesFromDirectory(srcPath,extensions,recursive);
    */
    getFilesFromDirectory: function (srcPath, extensions, recursive) {
        
        try {
            var srcDir = new File(srcPath);

            if (!this.fileOrDirectoryExists(srcDir)) {
                weinrich.as.Utils.logging(true, "ERROR loading files from path. Path (" + srcPath + ") doesn't exist...");
                return undefined;
            }

            var ext = java.util.Arrays.asList(extensions);

            var files = FileUtils.convertFileCollectionToFileArray(FileUtils.listFiles(
                srcDir,
                extensions ? new SuffixFileFilter(ext, IOCase.INSENSITIVE) : TrueFileFilter.INSTANCE,
                recursive ? TrueFileFilter.INSTANCE : FalseFileFilter.INSTANCE)
            );
    
            return files;
        }
        catch (e) {
            weinrich.as.Utils.logging(true, "ERROR loading files from path.\n" + e);
            return undefined;
        }
    },
        
    /**
    * Prüft, ob der übergebene Pfad auf ein Verzeichnis verweist.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   isDirectory
    * @param    {File}   file   Pfad für die Datei/den Ordner, der zu prüfen ist
    * @return   {bool}          True wenn Verzeichnis das File ein Verzeichnis ist
    */
    isDirectory: function (file) {
        
        return file.isDirectory();
    },

    /**
    * Prüft, ob der übergebene Pfad auf eine Datei verweist.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   isFile
    * @param    {File}   file   Pfad für die Datei/den Ordner, der zu prüfen ist
    * @return   {bool}          True wenn das File eine Datei ist
    */
    isFile: function (file) {
        
        return !file.isDirectory();
    },

    /**
    * Kopiert eine Datei in den angegebenen Pfad.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   copyFileToDir
    * @param    {File}   srcFile        Pfad auf die zu kopierende Datei
    * @param    {File}   destDir        Verzeichnis in das die Datei kopiert werden soll
    * @param    {bool}   overwrite      Überschreibe die Datei, falls der Pfad auf ein bereits existierendes File verweist
    * @return   {bool}                  True wenn erfolgreich kopiert
    * @example
    * var srcFile = new File("C:\\temp\\tmp\\tmp.pdf");
    * var destDir = new File("C:\\temp\\");
    * var overwrite = true;
    * weinrich.as.FileUtils.copyFileToDir(srcFile, destDir, overwrite);
    */
    copyFileToDir: function (srcFile, destDir, overwrite) {        
        try {

            //Prüfe, ob die zu kopierende Datei existiert
            if (!this.fileOrDirectoryExists(srcFile)) {
                weinrich.as.Utils.logging(true, "Fehler beim Kopieren der Datei. Datei nicht gefunden.");
                return false;
            }

            //Prüfe, ob die Datei im Zielpfad überschrieben werden soll    
            if (overwrite) {
                FileUtils.deleteQuietly(new File(destDir.getPath() + "\\" + srcFile.getName()));
            }

            //Kopiere Datei ins Zielverzeichnis
            FileUtils.copyFileToDirectory(srcFile, destDir);

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
    * @method   moveFileToDir
    * @param    {File}   srcFile        Pfad auf die zu verschiebende Datei
    * @param    {File}   destDir        Verzeichnis in das die Datei verschoben werden soll
    * @param    {bool}   overwrite      Überschreibe die Datei, falls der Pfad auf ein bereits existierendes File verweist
    * @return   {bool}                  True wenn erfolgreich verschoben
    * @example
    * var srcFile = new File("C:\\temp\\tmp\\tmp.pdf");
    * var destDir = new File("C:\\temp\\");
    * var overwrite = true;
    * weinrich.as.FileUtils.moveFileToDir(srcFile, destDir, overwrite);
    */
    moveFileToDir: function (srcFile, destDir, overwrite) {        
        try {

            //Pruefe, ob zu Verschiebende Datei existiert
            if (!this.fileOrDirectoryExists(srcFile)) {
                weinrich.as.Utils.logging(true, "Fehler beim Verschieben der Datei. Datei nicht gefunden.");
                return false;
            }

            //Wenn überschrieben werden soll, wird die Datei im Zielpfad zunächst gelöscht
            if (overwrite) {
                FileUtils.deleteQuietly(new File(destDir.getPath() + "\\" + srcFile.getName()));
            }

            //Verschiebt Datei ins Zielverzeichnis. Legt Verzeichnis an, falls es nicht existiert
            FileUtils.moveToDirectory(srcFile, destDir, true);

            return true;
        }
        catch(ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Verschieben der Datei.\n" + ex);
            return false;
        }
    },

    /**
    * Löscht eine Datei in den angegebenen Pfad.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   deleteFileOrDirectory
    * @param    {File}   srcFile        Pfad auf die zu löschende Datei
    * @return   {bool}                  True wenn erfolgreich gelöscht
    * @example
    * var srcFile = new File("C:\\temp\\tmp\\tmp.pdf");
    * weinrich.as.FileUtils.deleteFileOrDirectory(srcFile);
    */
    deleteFile: function (srcFile) {        
        try {

            //Prüfe, ob die zu löschende Datei existiert
            if (!this.fileOrDirectoryExists(srcFile)) {
                weinrich.as.Utils.logging(true, "Fehler beim Löschen der Datei. Datei nicht gefunden.");
                return false;
            }

            FileUtils.delete(srcFile);

            return true;
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Löschen der Datei.\n" + ex);
            return false;
        }
    },

    /**
    * Löscht ein Verzeichnis rekursiv.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.FileUtils
    * @method   deleteFileOrDirectory
    * @param    {File}   srcDir     Pfad auf die zu löschendes Verzeichnis
    * @return   {bool}              True wenn erfolgreich gelöscht
    * @example
    * var srcFile = new File("C:\\temp\\tmp\\tmp.pdf");
    * weinrich.as.FileUtils.deleteDirectory(srcFile);
    */
    deleteDirectory: function (srcDir) {        
        try {

            //Prüfe, ob die zu löschende Datei existiert
            if (!this.fileOrDirectoryExists(srcDir)) {
                weinrich.as.Utils.logging(true, "Fehler beim Löschen der Datei. Datei nicht gefunden.");
                return false;
            }

            FileUtils.deleteDirectory(srcDir);

            return true;
        }
        catch (ex) {
            weinrich.as.Utils.logging(true, "Fehler beim Löschen der Datei.\n" + ex);
            return false;
        }
    },
};

/**
 * Funktionen auf Dateiebene. Nutzt u.a. Funktionen von:  
 * - {@link http://www.forum.elo.com/javadoc/ix/20/de/elo/ix/client/WFDiagram.html}
 * @memberof weinrich.as
 * @namespace weinrich.as.WorkflowUtils
 * @type {object}
 * @version release 1.0.0 
 */
//TODO Test mich
weinrich.as.WorkflowUtils = {
     
    /**
    * Prüft, ob die Datei bzw. das Verzeichnis existiert.
    * @author   Erik Köhler - Weinrich
    * @memberof weinrich.as.WorkflowUtils
    * @method   getWorkflowsByTemplateName
    * @param    {int}       sordId              Id des Dokuments für das die Workflows 
    * @param    {string}    wfTemplateName      Name des Templates 
    * @return   {WFDiagram}                     Gibt den/die gefundenen Workflow/-s zurück. Ansonsten undefined.
    */
    getWorkflowsByTemplateName: function (sordId, wfTemplateName) {
          
        try {
            
            //Pruefe, ob ein aktiver Workflow mit dem uebergebenen Template Namen existiert
            if (sol.common.WfUtils.hasActiveWorkflow(sordId, wfTemplateName)) {
                //Kein aktiver Workflow mit dem Template gefunden
                return undefined;
            }

            //Setze Filter auf den Template Namen
            let filter = { template: wfTemplateName };
            
            //Lade die aktiven Workflows fuer das Sord abhaengig vom Template Namen des Workflows
            let wfs = sol.common.WfUtils.getActiveWorkflows(sordId, filter);  
    
            this.logging(false, "Anzahl gefundener Workflows = " + wfs.length);

            return wfs;           
        }
        catch (ex) {
            this.logging(true, "Fehler beim Laden des Workflows von " + sordId +
                " über den Template Namen '" + wfTemplateName + "'.\n" + ex);
            return undefined;
        }
    },
};

/**
 * Funktionen für die Anbindung an die ELO-Datenbank 
 * @memberof weinrich.as
 * @namespace weinrich.as.DbUtils
 * @type {object}
 * @version release 1.0.0 
 */
weinrich.as.DbUtils = {
     
    /**
    * Wendet die übergebene SELECT-Anweisung auf die ELO-Datenbank an und gibt die Einträge als Objekt zurück
    * @author   Erik Köhler - Weinrich
    * @param    {String}    query       Vollständige SELECT-Anweisung
    * @param    {int}       maxRows     Maximale Anzahl an zu suchenden Treffern
    * @return   {Object[]}              Gefundene Datenbankeinträge als Array von Objekten
    * @example
    * var query = "SELECT maskno, maskname FROM [Archiv].[dbo].[docmasks]";
    * var rows = weinrich.as.DbUtils.executeSelectQuery(query, 10000);     
    * for(var i = 0; i < rows.length; i++) {
    *   var row = rows[i];
    *   log.info("maskno=" + row["maskno"] + ", maskname=" + row["maskname"]);
    * }
    */
    executeSelectQuery: function(query, maxRows) {

        try {
            var connectionId = 1;
            var resultList = db.getMultiLine(connectionId, query, maxRows);  //Database data
            return resultList;
        }
        catch(ex) {
            log.info(logASRuleName + "Fehler beim Ausführen der SELECT-Anweisung (" + query + ")\n" + e);            
            return undefined;
        }
    },
};