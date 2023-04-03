# Weinrich-Library

Willkommen bei der `Weinrich-Library`. Hier wird generischer Code für ELO-Projekte bereitsgestellt.

Integrierte Funktionen:

1. Zeit- und Datumsfunktionen
2. Funktionen auf Dateiebene
3. Funktionen für ELO
4. Logging

# Einbindung in eine AS-Regel

Damit die Bibliothek lauffähig ist, müssen folgende ELO-Bibliotheken inkludiert werden:

- lib_Class
- ix: IndexServer Functions
- fu: File Utils

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

Version 1.0.4

- Hinzugefügt: weinrich.as.Utils.getFolderIdFromParentByName(int parentId, string folderName)

Version 1.0.3

- Hinzugefügt: weinrich.as.Utils.deleteSordFinally(int sordid, bool folderMustBeEmpty)

Version 1.0.2

- In FilterUtils jedes falsche "this" überarbeitet

Version 1.0.1

- Hinzugefügt: weinrich.as.Utils.renameSordById(int id, string name)
- Hinzugefügt: weinrich.as.Utils.arrIncludes(any[] arr, any value)