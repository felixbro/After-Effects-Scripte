(function distributeBetweenLayers() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Bitte öffne eine Komposition und wähle mindestens 3 Layer aus.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    var count = selectedLayers.length;

    if (count < 3) {
        alert("Bitte wähle mindestens 3 Layer aus.");
        return;
    }

    app.beginUndoGroup("Objekte gleichmäßig verteilen");

    var firstLayer = selectedLayers[0];
    var lastLayer = selectedLayers[count - 1];

    for (var i = 1; i < count - 1; i++) {
        var currentLayer = selectedLayers[i];

        // Expression string zusammensetzen
        var expression = 
            "var obj1 = thisComp.layer('" + firstLayer.name + "');\n" +
			"var obj2 = thisComp.layer('" + lastLayer.name + "');\n" +
			"var total = " + (count-1) + ";\n" +
			"var idx = " + i + ";\n" +
			"obj1.transform.position + (obj2.transform.position - obj1.transform.position) / total * idx;";

        currentLayer.transform.position.expression = expression;
    }

    app.endUndoGroup();
    alert((count - 2) + " Layer dynamisch verteilt.");
})();
