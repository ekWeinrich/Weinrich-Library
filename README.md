# Weinrich-Library

Willkommen bei der `Weinrich-Library`. Hier wird generischer Code für ELO-Projekte bereitsgestellt.

Integrierte Funktionen:

1. Zeit- und Datumsfunktionen
2. Funktionen auf Dateiebene
3. Funktionen für ELO
4. Logging

Damit die Bibliothek lauffähig ist, müssen folgende ELO-Bibliotheken included werden:

- lib_Class
- ix: IndexServer Functions
- fu: File Utils

Und natürlich die Bibliothek selber:

- <a href="https://ekweinrich.github.io/Weinrich-Library/lib_weinrich.as.js.html">lib_weinrich.as</a>

Um zu loggen:

Init log (nur 1 mal am Anfang)
weinrich.as.Utils.initLogging(true, "TestRule");
weinrich.as.Utils.logging(false, "TEST-LOG");



Falls Fehler in der Library oder im Code bekannt werden, können diese <a href="https://github.com/ekWeinrich/Weinrich-Library/issues">hier</a> 
übermittelt werden.