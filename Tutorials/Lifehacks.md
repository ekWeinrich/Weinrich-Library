Willkommen bei den Lifehacks der `Weinrich-Library`. Hier werden Funktionen vorgestellt, die Ihnen die Arbeit mit oder ohne Library vereinfachen sollen.

# AS-Regeln de-/aktivieren

Man kann mit wenig Code eine AS-Regel de-/aktivierbar machen.

Schritt 1: Erstelle eine boolsche Konstante, die in etwa heißt wie 'AS_REGEL_IS_ACTIVE' und setze sie standardmäßig auf TRUE.

Schritt 2: Pruefe am Anfang der main-Funktion AS_REGEL_IS_ACTIVE auf FALSE. Dies sorgt dafür, dass wenn die Konstante auf FALSE gesetzt wurde, man sofort
aus der AS-Regel rausspringt.

Beipielcode:

    const AS_REGEL_IS_ACTIVE = false;

    var lifehack = {

        main: function () {
            if(!AS_REGEL_IS_ACTIVE) return;
            
            //Hier kommt man nur hin, wenn AS_REGEL_IS_ACTIVE == true
            log.info("Lifehack");
        }
    };

    lifehack.main();