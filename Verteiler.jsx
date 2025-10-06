// Titel: Ebenen gleichmäßig und dynamisch verteilen (Korrigierte Version)
// Beschreibung: Verteilt eine Auswahl von Ebenen gleichmäßig zwischen der ersten und der letzten Ebene in der Auswahl.
// Die Positionen der mittleren Ebenen werden durch Expressions dynamisch an die Endpunkte gebunden.
// (c) 2025

(function distributeLayers() {
    
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Bitte wähle eine Komposition aus.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    var numLayers = selectedLayers.length;

    if (numLayers < 3) {
        alert("Bitte wähle mindestens 3 Ebenen aus:
Eine Startebene, eine Endebene und mindestens eine Ebene dazwischen.");
        return;
    }

    app.beginUndoGroup("Ebenen gleichmäßig verteilen");

    var firstLayer = selectedLayers[0];
    var lastLayer = selectedLayers[numLayers - 1];

    for (var i = 1; i < numLayers - 1; i++) {
        var currentLayer = selectedLayers[i];
        var positionProp = currentLayer.transform.position;

        // --- Expression-String ohne interne Kommentare ---
        // Dieser String wird der Positionseigenschaft der Ebene zugewiesen.
        // Er berechnet die Position basierend auf den äußeren Ebenen.
        var expression = `
var first = thisComp.layer("${firstLayer.name}");
var last = thisComp.layer("${lastLayer.name}");
var indexInSelection = ${i}; 
var totalSelected = ${numLayers};
var t = indexInSelection / (totalSelected - 1);
linear(t, first.transform.position, last.transform.position);
`;

        positionProp.expression = expression;
    }

    app.endUndoGroup();

    alert("Die " + (numLayers - 2) + " mittleren Ebenen wurden erfolgreich zwischen '" + firstLayer.name + "' und '" + lastLayer.name + "' verteilt.");

})();
