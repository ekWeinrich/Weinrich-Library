# Weinrich-Library v1.0.8

Willkommen bei der `Weinrich-Library`. Hier wird generischer Code für ELO-Projekte bereitsgestellt.

Hier geht es zu den Lifehacks für AS-Regeln: <a href="https://ekweinrich.github.io/Weinrich-Library/tutorial-Lifehacks.html">Lifehacks</a>

Integrierte Funktionen:

1. Zeit- und Datumsfunktionen
2. Funktionen auf Dateiebene
3. Funktionen für ELO
4. Logging
5. Filterfunktionen

# Einbindung in eine AS-Regel

Damit die Bibliothek lauffähig ist, müssen folgende ELO-Bibliotheken inkludiert werden:

- lib_Class
- ix: IndexServer Functions
- fu: File Utils
- wf: Workflow Utils
- lib_sol.common.WfUtils
- lib_sol.common.SordUtils

Und natürlich die Bibliothek selber:

- <a href="https://ekweinrich.github.io/Weinrich-Library/lib_weinrich.as.js.html">lib_weinrich.as</a>

# Logging

Initialisiere die Log-Funktion 1 mal initial am Anfang der Regel:
weinrich.as.Utils.initLogging(true, "NameDerAS-Regel");
True/False stehen hier für Debug-Modus. Bei True wird immer ein Logeintrag geschrieben. Bei False nur, falls man später einen Prioritätslog verwendet.

Danach kann folgendermaßen geloggt werden:
weinrich.as.Utils.logging(false, "Dies ist ein Dummy-Logeintrag");
True/False stehen hier für Prioritätslog. Bei True wird immer ein Logeintrag geschrieben, auch wenn man nicht im Debug-Modus ist.
 

Falls Fehler in der Library oder im Code bekannt werden, können diese <a href="https://github.com/ekWeinrich/Weinrich-Library/issues">hier</a> 
übermittelt werden.

# Patchnotes

## Version 1.0.8 - 04.10.2023

**Include hinzugefügt:**  lib_sol.common.SordUtils

**Hinzugefügt:** weinrich.as.FileUtils.getFilesFromDirectory(srcPath, extensions, recursive);
    - Gibt die Dateien aus einem Ordner gefiltert nach übergebenen Dateiendungen zurück

**Hinzugefügt:** weinrich.as.Utils.changeMask(sordId, maskName);
    - Ändert die Maske des Sords (wahlweise über den Namen oder die Id der Maske)

## Version 1.0.7 - 12.09.2023

**Angepasst:** weinrich.as.Utils.importDocument Bugfix: Länge des Dateinamen wird nun korrekt geprüft und gekürzt

## Version 1.0.6 - 11.07.2023

**Hinzugefügt:** Menüeintrag 'Tutorials' mit der Möglichkeit verschiedene Anleitungen zu hinterlegen

**Hinzugefügt:** 'Lifehacks' in 'Tutorials' angelegt. Darin allgemeine Hilfestellungen allgemein zu AS-Regeln

## Version 1.0.5 - 22.06.2023

**Hinzugefügt:** weinrich.as.FilterUtils.getJSONStringByFindResult(findResult);
- Gibt einen JSON-String zurück, der über das FindResult erstellt wurde.

**Hinzugefügt:** weinrich.as.Utils.createDynFolderByFindResult(parentId, folderName, findResult);
- Erstellt einen dynamischen Ordner über das FindResult.

**Hinzugefügt:** weinrich.as.Utils.getFindResultByDocName(maskname, docname, numberOfResults);
- Sucht nach Dokumenten einer Maske über deren Kurzbezeichnung. Gibt das FindResult zurück.

**Angepasst:** weinrich.as.Utils.getSordsByDocName(maskname, docname, numberOfResults);
- Sucht nach Dokumenten einer Maske über deren Kurzbezeichnung. Gibt das ein String[] zurück.

**Hinzugefügt:** weinrich.as.Utils.getFindResultByIndexfield(maskname, indexfeldName, indexfeldWert, numberOfResults);
- Sucht nach Dokumenten einer Maske über den Wert eines Indexfeldes. Gibt das FindResult zurück.

**Angepasst:** weinrich.as.Utils.getSordsByIndexfield(maskname, indexfeldName, indexfeldWert, numberOfResults);
- Sucht nach Dokumenten einer Maske über den Wert eines Indexfeldes. Gibt das ein String[] zurück.

**Hinzugefügt:** weinrich.as.Utils.setIndexfieldValueByName(sordId, indexfieldName, indexfieldValue);
- Setzt den Wert des Indexfeldes eines Sords über den Namen des Indexfeldes

**Hinzugefügt:** weinrich.as.Utils.setIndexfieldValueByParamList(sordId, objKeysObj);
- Setzt Werte des Indexfeldes eines Sords über ein Objekt (z.B. {"BETRAG": "499.50"})

**Angepasst:** weinrich.as.Utils.importDocument(file, sordId, maskName, objKeysObj, corruptFileDest);
- Neuer Methodenaufruf: Der neue Parameter corruptFileDest erwartet einen Pfad auf einen Ordner, in den korrupte/fehlerhafte Dateien verschoben werden,
sodass diese den nächsten Import nicht blockieren. Lässt man den Parameter weg oder leer, wird die Datei nicht verschoben. Wurde die Datei nicht importiert wird nun immer -1 zurückgegeben

## Version 1.0.4

**Hinzugefügt:** weinrich.as.Utils.getFolderIdFromParentByName(int parentId, string folderName);

## Version 1.0.3

**Hinzugefügt:** weinrich.as.Utils.deleteSordFinally(int sordid, bool folderMustBeEmpty);

## Version 1.0.2

**Angepasst:**: In FilterUtils jedes falsche "this" überarbeitet

## Version 1.0.1

**Hinzugefügt:** weinrich.as.Utils.renameSordById(int id, string name);

**Hinzugefügt:** weinrich.as.Utils.arrIncludes(any[] arr, any value);