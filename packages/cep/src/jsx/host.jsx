/**
 * AE AI Extension - ExtendScript Host Functions
 *
 * This file contains all ExtendScript (JSX) functions that run in After Effects.
 * NOTE: This code must be ES3 compatible (no let/const, no arrow functions).
 */

/**
 * Capture selected layers and return their structure as JSON
 * (F-1: レイヤー構造の解析, 物理パラメータの自動抽出)
 */
function captureSelectedLayers() {
    try {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            return JSON.stringify({
                success: false,
                error: "アクティブなコンポジションがありません"
            });
        }

        var selectedLayers = comp.selectedLayers;

        if (selectedLayers.length === 0) {
            return JSON.stringify({
                success: false,
                error: "レイヤーが選択されていません"
            });
        }

        var layers = [];

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var layerData = extractLayerData(layer);
            layers.push(layerData);
        }

        return JSON.stringify({
            success: true,
            composition: {
                name: comp.name,
                width: comp.width,
                height: comp.height,
                frameRate: comp.frameRate,
                duration: comp.duration
            },
            layers: layers
        });

    } catch (e) {
        return JSON.stringify({
            success: false,
            error: e.toString()
        });
    }
}

/**
 * Extract data from a single layer
 */
function extractLayerData(layer) {
    var data = {
        id: layer.index,
        name: layer.name,
        type: getLayerType(layer),
        parentId: layer.parent ? layer.parent.index : null,
        parameters: extractPhysicalParameters(layer)
    };

    return data;
}

/**
 * Determine layer type
 */
function getLayerType(layer) {
    if (layer instanceof ShapeLayer) {
        return "shape";
    } else if (layer instanceof TextLayer) {
        return "text";
    } else if (layer instanceof AVLayer) {
        if (layer.nullLayer) {
            return "null";
        }
        return "footage";
    } else if (layer instanceof CameraLayer) {
        return "camera";
    } else if (layer instanceof LightLayer) {
        return "light";
    }
    return "unknown";
}

/**
 * Extract physical parameters from a layer
 * (F-1: 物理パラメータの自動抽出)
 */
function extractPhysicalParameters(layer) {
    var transform = layer.transform;
    var params = {};

    // Position
    try {
        var pos = transform.position.value;
        params.position = pos.length === 3 ? [pos[0], pos[1], pos[2]] : [pos[0], pos[1]];
    } catch (e) {
        params.position = [0, 0];
    }

    // Anchor Point
    try {
        var anchor = transform.anchorPoint.value;
        params.anchor_point = anchor.length === 3 ? [anchor[0], anchor[1], anchor[2]] : [anchor[0], anchor[1]];
    } catch (e) {
        params.anchor_point = [0, 0];
    }

    // Scale
    try {
        var scale = transform.scale.value;
        params.scale = scale.length === 3 ? [scale[0], scale[1], scale[2]] : [scale[0], scale[1]];
    } catch (e) {
        params.scale = [100, 100];
    }

    // Rotation
    try {
        if (layer.threeDLayer) {
            params.rotation = [
                transform.xRotation.value,
                transform.yRotation.value,
                transform.zRotation.value
            ];
        } else {
            params.rotation = transform.rotation.value;
        }
    } catch (e) {
        params.rotation = 0;
    }

    // Opacity
    try {
        params.opacity = transform.opacity.value;
    } catch (e) {
        params.opacity = 100;
    }

    return params;
}

/**
 * Get all layers in the active composition
 */
function getAllLayers() {
    try {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            return JSON.stringify({
                success: false,
                error: "アクティブなコンポジションがありません"
            });
        }

        var layers = [];

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            layers.push(extractLayerData(layer));
        }

        return JSON.stringify({
            success: true,
            layers: layers
        });

    } catch (e) {
        return JSON.stringify({
            success: false,
            error: e.toString()
        });
    }
}

/**
 * Apply animation keyframes to a layer
 */
function applyKeyframes(layerIndex, propertyPath, keyframes) {
    try {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            return JSON.stringify({
                success: false,
                error: "アクティブなコンポジションがありません"
            });
        }

        var layer = comp.layer(layerIndex);
        var property = layer;

        // Navigate to the property
        var pathParts = propertyPath.split(".");
        for (var i = 0; i < pathParts.length; i++) {
            property = property.property(pathParts[i]);
        }

        if (!property.canSetExpression) {
            return JSON.stringify({
                success: false,
                error: "このプロパティにキーフレームを設定できません"
            });
        }

        // Apply keyframes
        for (var j = 0; j < keyframes.length; j++) {
            var kf = keyframes[j];
            property.setValueAtTime(kf.time, kf.value);
        }

        return JSON.stringify({
            success: true,
            message: "キーフレームを適用しました"
        });

    } catch (e) {
        return JSON.stringify({
            success: false,
            error: e.toString()
        });
    }
}

/**
 * Get composition info
 */
function getCompositionInfo() {
    try {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            return JSON.stringify({
                success: false,
                error: "アクティブなコンポジションがありません"
            });
        }

        return JSON.stringify({
            success: true,
            composition: {
                name: comp.name,
                width: comp.width,
                height: comp.height,
                frameRate: comp.frameRate,
                duration: comp.duration,
                numLayers: comp.numLayers
            }
        });

    } catch (e) {
        return JSON.stringify({
            success: false,
            error: e.toString()
        });
    }
}

/**
 * Extract keyframe information from a property
 * (F-1: キーフレーム情報の抽出)
 */
function extractKeyframes(property) {
    var keyframes = [];

    if (!property.numKeys || property.numKeys === 0) {
        return keyframes;
    }

    for (var i = 1; i <= property.numKeys; i++) {
        var kf = {
            index: i,
            time: property.keyTime(i),
            value: property.keyValue(i)
        };

        // Get keyframe interpolation type
        try {
            kf.inInterpolationType = property.keyInInterpolationType(i);
            kf.outInterpolationType = property.keyOutInterpolationType(i);
        } catch (e) {
            // Some properties don't support interpolation types
        }

        // Get temporal ease
        try {
            var inEase = property.keyInTemporalEase(i);
            var outEase = property.keyOutTemporalEase(i);

            kf.inTemporalEase = [];
            kf.outTemporalEase = [];

            for (var j = 0; j < inEase.length; j++) {
                kf.inTemporalEase.push({
                    speed: inEase[j].speed,
                    influence: inEase[j].influence
                });
            }

            for (var k = 0; k < outEase.length; k++) {
                kf.outTemporalEase.push({
                    speed: outEase[k].speed,
                    influence: outEase[k].influence
                });
            }
        } catch (e) {
            // Some properties don't support temporal ease
        }

        // Get spatial tangents for position-like properties
        try {
            kf.inSpatialTangent = property.keyInSpatialTangent(i);
            kf.outSpatialTangent = property.keyOutSpatialTangent(i);
            kf.roving = property.keyRoving(i);
        } catch (e) {
            // Not a spatial property
        }

        keyframes.push(kf);
    }

    return keyframes;
}

/**
 * Extract all keyframes from selected layers
 * (F-1: キーフレーム情報の抽出)
 */
function captureLayerKeyframes() {
    try {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            return JSON.stringify({
                success: false,
                error: "アクティブなコンポジションがありません"
            });
        }

        var selectedLayers = comp.selectedLayers;

        if (selectedLayers.length === 0) {
            return JSON.stringify({
                success: false,
                error: "レイヤーが選択されていません"
            });
        }

        var result = [];

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var layerData = {
                index: layer.index,
                name: layer.name,
                properties: {}
            };

            // Extract transform keyframes
            var transform = layer.transform;
            var transformProps = ["anchorPoint", "position", "scale", "rotation", "opacity"];

            for (var j = 0; j < transformProps.length; j++) {
                var propName = transformProps[j];
                try {
                    var prop = transform.property(propName);
                    if (prop && prop.numKeys > 0) {
                        layerData.properties["transform." + propName] = {
                            keyframes: extractKeyframes(prop),
                            expression: prop.expression || null
                        };
                    }
                } catch (e) {
                    // Property doesn't exist or can't be accessed
                }
            }

            // Handle 3D rotation separately
            if (layer.threeDLayer) {
                var rotationProps = ["xRotation", "yRotation", "zRotation", "orientation"];
                for (var k = 0; k < rotationProps.length; k++) {
                    var rotPropName = rotationProps[k];
                    try {
                        var rotProp = transform.property(rotPropName);
                        if (rotProp && rotProp.numKeys > 0) {
                            layerData.properties["transform." + rotPropName] = {
                                keyframes: extractKeyframes(rotProp),
                                expression: rotProp.expression || null
                            };
                        }
                    } catch (e) {
                        // Property doesn't exist
                    }
                }
            }

            result.push(layerData);
        }

        return JSON.stringify({
            success: true,
            frameRate: comp.frameRate,
            duration: comp.duration,
            layers: result
        });

    } catch (e) {
        return JSON.stringify({
            success: false,
            error: e.toString()
        });
    }
}

/**
 * Get keyframes for a specific property path
 */
function getPropertyKeyframes(layerIndex, propertyPath) {
    try {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            return JSON.stringify({
                success: false,
                error: "アクティブなコンポジションがありません"
            });
        }

        var layer = comp.layer(layerIndex);
        var property = layer;

        // Navigate to the property
        var pathParts = propertyPath.split(".");
        for (var i = 0; i < pathParts.length; i++) {
            property = property.property(pathParts[i]);
            if (!property) {
                return JSON.stringify({
                    success: false,
                    error: "プロパティが見つかりません: " + propertyPath
                });
            }
        }

        return JSON.stringify({
            success: true,
            property: propertyPath,
            numKeys: property.numKeys || 0,
            keyframes: extractKeyframes(property),
            expression: property.expression || null,
            value: property.value
        });

    } catch (e) {
        return JSON.stringify({
            success: false,
            error: e.toString()
        });
    }
}
