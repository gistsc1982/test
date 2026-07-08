import { CreateAttackArrow } from "./CreateAttackArrow";

import createVertex from "@mapbox/mapbox-gl-draw/src/lib/create_vertex";

const Constants = require("@mapbox/mapbox-gl-draw/src/constants");

import *as CommonSelectors from "@mapbox/mapbox-gl-draw/src/lib/common_selectors";

import isEventAtCoordinates from "@mapbox/mapbox-gl-draw/src/lib/is_event_at_coordinates";

const doubleClickZoom = {
    enable(t) { setTimeout(() => { t.map && t.map.doubleClickZoom && t._ctx && t._ctx.store && t._ctx.store.getInitialConfigValue && t._ctx.store.getInitialConfigValue("doubleClickZoom") && t.map.doubleClickZoom.enable() }, 0) }, disable(t) { setTimeout(() => { t.map && t.map.doubleClickZoom && t.map.doubleClickZoom.disable() }, 0) }
}, DrawAttackArrow =
    {
        onSetup: function (t) {
            const e = this.newFeature(
                { type: Constants.geojsonTypes.FEATURE, properties: { isAttackArrow: !0 }, geometry: { type: Constants.geojsonTypes.POLYGON, coordinates: [[]] } });
 return this.addFeature(e), this.clearSelectedFeatures(), doubleClickZoom.disable(this), this.updateUIClasses({ mouse: Constants.cursors.ADD }), this.activateUIButton(Constants.types.POLYGON), this.setActionableState({ trash: !0 }), { attackArrow: e, currentVertexPosition: 0 }
        }, onTap: function (t, e) { t.attackArrow.properties.attackArrowPoint1 && this.onMouseMove(t, e), this.onClick(t, e) }, onKeyUp: function (t, e) { CommonSelectors.isEscapeKey(e) ? (this.deleteFeature([t.attackArrow.id], { silent: !0 }), this.changeMode(Constants.modes.SIMPLE_SELECT)) : CommonSelectors.isEnterKey(e) && this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [t.attackArrow.id] }) }, onTrash: function (t) { this.deleteFeature([t.attackArrow.id], { silent: !0 }), this.changeMode("simple_select") }, onStop: function (t) { this.updateUIClasses({ mouse: Constants.cursors.NONE }), doubleClickZoom.enable(this), this.activateUIButton(), this.getFeature(t.attackArrow.id) }, onClick: function (t, e) { if (CommonSelectors.isVertex(e)) return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [t.attackArrow.id] });
 if (t.currentVertexPosition > 0 && isEventAtCoordinates(e, t.attackArrow.coordinates[0][t.currentVertexPosition - 1])) return this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [t.attackArrow.id] });
 if (this.updateUIClasses({ mouse: Constants.cursors.ADD }), t.attackArrow.updateCoordinate(`0.${t.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat), t.currentVertexPosition++, t.attackArrow.updateCoordinate(`0.${t.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat), t.attackArrow.properties["attackArrowPoint" + t.currentVertexPosition] = [e.lngLat.lng, e.lngLat.lat], t.attackArrow.properties.attackArrowPoint3) { let e = CreateAttackArrow(t.attackArrow.properties);
 t.attackArrow.incomingCoords(e) } }, onMouseMove: function (t, e) { if (t.attackArrow.updateCoordinate(`0.${t.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat), CommonSelectors.isVertex(e) && this.updateUIClasses({ mouse: Constants.cursors.POINTER }), t.attackArrow.properties.attackArrowPoint1 && (t.attackArrow.properties.attackArrowPoint2 || t.attackArrow.updateCoordinate(`0.${t.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat), t.attackArrow.properties.movePoint = [e.lngLat.lng, e.lngLat.lat], t.attackArrow.properties.attackArrowPoint2)) { let e = CreateAttackArrow(t.attackArrow.properties, "move");
 t.attackArrow.incomingCoords(e) } }, toDisplayFeatures: function (t, e, o) { const r = e.properties.id === t.attackArrow.id;
 if (e.properties.active = r ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE, !r) return o(e);
 if (0 === e.geometry.coordinates.length) return;
 const a = e.geometry.coordinates[0].length;
 if (!(a < 3)) { if (Object.getOwnPropertyNames(t.attackArrow.properties).forEach(function (e, r) { -1 != e.indexOf("attackArrowPoint") && o(createVertex(t.attackArrow.id, t.attackArrow.properties[e], `0.${r}`, !1)) }), a <= 4) { const t = [[e.geometry.coordinates[0][0][0], e.geometry.coordinates[0][0][1]], [e.geometry.coordinates[0][1][0], e.geometry.coordinates[0][1][1]]];
 if (o({ type: Constants.geojsonTypes.FEATURE, properties: e.properties, geometry: { coordinates: t, type: Constants.geojsonTypes.LINE_STRING } }), 3 === a) return } return o(e) } }
    };
 export default DrawAttackArrow;
