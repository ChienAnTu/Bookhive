$axure.internal(function($ax) {
    $ax.public.fn.matrixMultiply = function(matrix, vector) {
        if(!matrix.tx) matrix.tx = 0;
        if(!matrix.ty) matrix.ty = 0;
        var outX = matrix.m11 * vector.x + matrix.m12 * vector.y + matrix.tx;
        var outY = matrix.m21 * vector.x + matrix.m22 * vector.y + matrix.ty;
        return { x: outX, y: outY };
    }

    $ax.public.fn.matrixInverse = function(matrix) {
        if(!matrix.tx) matrix.tx = 0;
        if(!matrix.ty) matrix.ty = 0;

        var determinant = matrix.m11*matrix.m22 - matrix.m12*matrix.m21;
        //var threshold = (M11 * M11 + M22 *M22 + M12 *M12+ M21 *M21) / 100000;
        //if(determinant.DeltaEquals(0, threshold) && determinant < 0.01) {
        //    return Invalid;
        //}
        return  {
            m11 : matrix.m22/determinant,
            m12 : -matrix.m12/determinant,
            tx : (matrix.ty*matrix.m12 - matrix.tx*matrix.m22)/determinant,
            m21: -matrix.m21 / determinant,
            m22: matrix.m11 / determinant,
            ty: (matrix.tx * matrix.m21 - matrix.ty * matrix.m11) / determinant
        };
    }


    $ax.public.fn.matrixMultiplyMatrix = function (matrix1, matrix2) {
        if (!matrix1.tx) matrix1.tx = 0;
        if (!matrix1.ty) matrix1.ty = 0;
        if (!matrix2.tx) matrix2.tx = 0;
        if (!matrix2.ty) matrix2.ty = 0;

        return {
            m11: matrix1.m12*matrix2.m21 + matrix1.m11*matrix2.m11,
            m12: matrix1.m12*matrix2.m22 + matrix1.m11*matrix2.m12,
            tx: matrix1.m12 * matrix2.ty + matrix1.m11 * matrix2.tx + matrix1.tx,
            m21: matrix1.m22 * matrix2.m21 + matrix1.m21 * matrix2.m11,
            m22: matrix1.m22 * matrix2.m22 + matrix1.m21 * matrix2.m12,
            ty: matrix1.m22 * matrix2.ty + matrix1.m21 * matrix2.tx + matrix1.ty,
        };
    }


    $ax.public.fn.transformFromElement = function (element) {
        var st = window.getComputedStyle(element, null);

        var tr = st.getPropertyValue("-webkit-transform") ||
            st.getPropertyValue("-moz-transform") ||
            st.getPropertyValue("-ms-transform") ||
            st.getPropertyValue("-o-transform") ||
            st.getPropertyValue("transform");

        if (tr.indexOf('none') < 0) {
            var matrix = tr.split('(')[1];
            matrix = matrix.split(')')[0];
            matrix = matrix.split(',');
            for (var l = 0; l < matrix.length; l++) {
                matrix[l] = Number(matrix[l]);
            }

        } else { matrix = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0]; }

        return matrix;
        // matrix[0] = cosine, matrix[1] = sine. 
        // Assuming the element is still orthogonal.
    }

    $ax.public.fn.vectorMinus = function(vector1, vector2) { return { x: vector1.x - vector2.x, y: vector1.y - vector2.y }; }

    $ax.public.fn.vectorPlus = function (vector1, vector2) { return { x: vector1.x + vector2.x, y: vector1.y + vector2.y }; }

    $ax.public.fn.vectorMidpoint = function (vector1, vector2) { return { x: (vector1.x + vector2.x) / 2.0, y: (vector1.y + vector2.y) / 2.0 }; }

    $ax.public.fn.fourCornersToBasis = function (fourCorners) {
        return {
            widthVector: $ax.public.fn.vectorMinus(fourCorners.widgetTopRight, fourCorners.widgetTopLeft),
            heightVector: $ax.public.fn.vectorMinus(fourCorners.widgetBottomLeft, fourCorners.widgetTopLeft)
        };
    }

    $ax.public.fn.matrixString = function(m11, m21, m12, m22, tx, ty) {
        return "Matrix(" + m11 + "," + m21 + "," + m12 + "," + m22 + ", " + tx + ", " + ty + ")";
    }
    
    var _getLayerChildrenDeep = $ax.public.fn.getLayerChildrenDeep = function (layerId, includeLayers, includeHidden) {
        var deep = [];
        var children = $ax('#' + layerId).getChildren()[0].children;
        for (var index = 0; index < children.length; index++) {
            var childId = children[index];
            if(!includeHidden && !$ax.visibility.IsIdVisible(childId)) continue;
            if ($ax.public.fn.IsLayer($obj(childId).type)) {
                if (includeLayers) deep.push(childId);
                var recursiveChildren = _getLayerChildrenDeep(childId, includeLayers, includeHidden);
                for (var j = 0; j < recursiveChildren.length; j++) deep.push(recursiveChildren[j]);
            } else deep.push(childId);
        }
        return deep;
    };

    var _getPointAfterRotate = $ax.public.fn.getPointAfterRotate = function (angleInDegrees, pointToRotate, centerPoint) {
        var displacement = $ax.public.fn.vectorMinus(pointToRotate, centerPoint);
        var rotationMatrix = $ax.public.fn.rotationMatrix(angleInDegrees);
        rotationMatrix.tx = centerPoint.x;
        rotationMatrix.ty = centerPoint.y;
        return $ax.public.fn.matrixMultiply(rotationMatrix, displacement);
    };

    $ax.public.fn.getBoundingSizeForRotate = function(width, height, rotation) {
        // point to rotate around doesn't matter since we just care about size, if location matter we need more args and location matters.

        var origin = { x: 0, y: 0 };

        var corner1 = { x: width, y: 0 };
        var corner2 = { x: 0, y: height };
        var corner3 = { x: width, y: height };

        corner1 = _getPointAfterRotate(rotation, corner1, origin);
        corner2 = _getPointAfterRotate(rotation, corner2, origin);
        corner3 = _getPointAfterRotate(rotation, corner3, origin);

        var left = Math.min(0, corner1.x, corner2.x, corner3.x);
        var right = Math.max(0, corner1.x, corner2.x, corner3.x);
        var top = Math.min(0, corner1.y, corner2.y, corner3.y);
        var bottom = Math.max(0, corner1.y, corner2.y, corner3.y);

        return { width: right - left, height: bottom - top };
    }

    $ax.public.fn.getBoundingRectForRotate = function (boundingRect, rotation) {
        var centerPoint = boundingRect.centerPoint;
        var corner1 = { x: boundingRect.left, y: boundingRect.top };
        var corner2 = { x: boundingRect.right, y: boundingRect.top };
        var corner3 = { x: boundingRect.right, y: boundingRect.bottom };
        var corner4 = { x: boundingRect.left, y: boundingRect.bottom };
        corner1 = _getPointAfterRotate(rotation, corner1, centerPoint);
        corner2 = _getPointAfterRotate(rotation, corner2, centerPoint);
        corner3 = _getPointAfterRotate(rotation, corner3, centerPoint);
        corner4 = _getPointAfterRotate(rotation, corner4, centerPoint);

        var left = Math.min(corner1.x, corner2.x, corner3.x, corner4.x);
        var right = Math.max(corner1.x, corner2.x, corner3.x, corner4.x);
        var top = Math.min(corner1.y, corner2.y, corner3.y, corner4.y);
        var bottom = Math.max(corner1.y, corner2.y, corner3.y, corner4.y);

        return { left: left, top: top, width: right - left, height: bottom - top };
    }

    var _isCompoundVectorHtml = $ax.public.fn.isCompoundVectorHtml = function(hElement) {
        return hElement.hasAttribute('compoundmode') && hElement.getAttribute('compoundmode') == "true";
    }

    $ax.public.fn.removeCompound = function (jobj) { if(_isCompoundVectorHtml(jobj[0])) jobj.removeClass('compound'); }
    $ax.public.fn.restoreCompound = function (jobj) { if (_isCompoundVectorHtml(jobj[0])) jobj.addClass('compound'); }

    $ax.public.fn.compoundIdFromComponent = function(id) {

        var pPos = id.indexOf('p');
        var dashPos = id.indexOf('-');
        if (pPos < 1) return id;
        else if (dashPos < 0) return id.substring(0, pPos);
        else return id.substring(0, pPos) + id.substring(dashPos);
    }

    $ax.public.fn.l2 = function (x, y) { return Math.sqrt(x * x + y * y); }

    $ax.public.fn.convertToSingleImage = function (jobj) {
        if(!jobj[0]) return;

        var widgetId = jobj[0].id;
        var object = $obj(widgetId);

        if ($ax.public.fn.IsLayer(object.type)) {
            var recursiveChildren = _getLayerChildrenDeep(widgetId, true);
            for (var j = 0; j < recursiveChildren.length; j++)
                $ax.public.fn.convertToSingleImage($jobj(recursiveChildren[j]));
            return;
        }

        //var layer = 

        if(!_isCompoundVectorHtml(jobj[0])) return;


        $('#' + widgetId).removeClass("compound");
        $('#' + widgetId + '_img').removeClass("singleImg");
        $('#' + widgetId + '_div').removeClass("singleImg");
        jobj[0].setAttribute('compoundmode', 'false');
        
        var components = object.compoundChildren;
        delete object.generateCompound;

        if(!components) return;
        for (var i = 0; i < components.length; i++) {
            var componentJobj = $jobj($ax.public.fn.getComponentId(widgetId, components[i]));
            componentJobj.css('display', 'none');
            componentJobj.css('visibility', 'hidden');
        }
    }


    $ax.public.fn.getContainerDimensions = function(query) {
        // returns undefined if no containers found.
        var containerDimensions;
        for (var i = 0; i < query[0].children.length; i++) {
            var node = query[0].children[i];
            if (node.id.indexOf(query[0].id) >= 0 && node.id.indexOf('container') >= 0) {
                containerDimensions = node.style;
            }
        }
        return containerDimensions;
    }


    $ax.public.fn.rotationMatrix = function (angleInDegrees) {
        var angleInRadians = angleInDegrees * (Math.PI / 180);
        var cosTheta = Math.cos(angleInRadians);
        var sinTheta = Math.sin(angleInRadians);

        return { m11: cosTheta, m12: -sinTheta, m21: sinTheta, m22: cosTheta, tx: 0.0, ty: 0.0 };
    }

    $ax.public.fn.GetFieldFromStyle = function (query, field) {
        var raw = query[0].style[field];
        if (!raw) raw = query.css(field);
        return Number(raw.replace('px', ''));
        }


    $ax.public.fn.setTransformHowever = function (transformString) {
        return {
            '-webkit-transform': transformString,
            '-moz-transform': transformString,
            '-ms-transform': transformString,
            '-o-transform': transformString,
            'transform': transformString
        };
    }

    $ax.public.fn.inversePathLengthFunction = function (pathFunction) {
        // these are for computing the inverse functions of path integrals.

        var makeDivisionNode = function(node1, node2) {
            var param = 0.5 * (node1.Param + node2.Param);
            var inBetweenNode = {
                LowerStop: node1,
                HigherStop: node2,
                Param: param,
                Position: pathFunction(param),
                Cumulative: 0.0
            };
            var lowerDisplacement = $ax.public.fn.vectorMinus(node1.Position, inBetweenNode.Position);
            inBetweenNode.LowerInterval = {
                Length: $ax.public.fn.l2(lowerDisplacement.x, lowerDisplacement.y),
                Node: inBetweenNode,
                IsHigher: false
            };
            var higherDisplacement = $ax.public.fn.vectorMinus(node2.Position, inBetweenNode.Position);
            inBetweenNode.HigherInterval = {
                Length: $ax.public.fn.l2(higherDisplacement.x, higherDisplacement.y),
                Node: inBetweenNode,
                IsHigher: true
            };
            return inBetweenNode;
        };

        var expandLower = function(node) {
            node.LowerChild = makeDivisionNode(node.LowerStop, node);
            node.LowerChild.Parent = node;
        };

        var expandHigher = function(node) {
            node.HigherChild = makeDivisionNode(node, node.HigherStop);
            node.HigherChild.Parent = node;
        };

        // for this function, cumulative is a global variable
        var cumulative = 0.0;
        var labelCumulativeLength = function(node) {
            if(!node.LowerChild) {
                node.LowerStop.Cumulative = cumulative;
                cumulative += node.LowerInterval.Length;
                node.Cumulative = cumulative;
            } else labelCumulativeLength(node.LowerChild);

            if(!node.HigherChild) {
                node.Cumulative = cumulative;
                cumulative += node.HigherInterval.Length;
                node.HigherStop.Cumulative = cumulative;
            } else labelCumulativeLength(node.HigherChild);
        };

        var getIntervalFromPathLength = function(node, length) {
            if(length < node.Cumulative) {
                return node.LowerChild ? getIntervalFromPathLength(node.LowerChild, length) : node.LowerInterval;
            } else return node.HigherChild ? getIntervalFromPathLength(node.HigherChild, length) : node.HigherInterval;
        };

        var intervalLowerEnd = function(interval) {
            return interval.IsHigher ? interval.Node : interval.Node.LowerStop;
        };

        var intervalHigherEnd = function(interval) {
            return interval.IsHigher ? interval.Node.HigherStop : interval.Node;
        };

        var getParameterFromPathLength = function (node, length) {
            var interval = getIntervalFromPathLength(node, length);
            var lowerNode = intervalLowerEnd(interval);
            var higherNode = intervalHigherEnd(interval);
            return lowerNode.Param + (higherNode.Param - lowerNode.Param) * (length - lowerNode.Cumulative) / (higherNode.Cumulative - lowerNode.Cumulative);
        };

        var insertIntoSortedList = function (longer, shorter, toInsert) {
            while (true) {
                if (!longer) {
                    longer = shorter;
                    shorter = shorter.NextLongest;
                    continue;
                } else if (!shorter) longer.NextLongest = toInsert;
                else {
                    if (longer.Length >= toInsert.Length && shorter.Length <= toInsert.Length) {
                        longer.NextLongest = toInsert;
                        toInsert.NextLongest = shorter;
                    } else {
                        longer = shorter;
                        shorter = shorter.NextLongest;
                        continue;
                    }
                }
                break;
            }
        }
        var head = {Param: 0.0, Position: pathFunction(0.0) };
        var tail = { Param: 1.0, Position: pathFunction(1.0) };
        var root = makeDivisionNode(head, tail);
        var currentCurveLength = root.LowerInterval.Length + root.HigherInterval.Length;
        var longestInterval;
        if (root.LowerInterval.Length < root.HigherInterval.Length) {
            longestInterval = root.HigherInterval;
            longestInterval.NextLongest = root.LowerInterval;
        } else {
            longestInterval = root.LowerInterval;
            longestInterval.NextLongest = root.HigherInterval;
        }
        while (longestInterval.Length * 100.0 > currentCurveLength) {
            var newNode;
            if (longestInterval.IsHigher) {
                expandHigher(longestInterval.Node);
                newNode = longestInterval.Node.HigherChild;
            } else {
                expandLower(longestInterval.Node);
                newNode = longestInterval.Node.LowerChild;
            }
            currentCurveLength += (newNode.LowerInterval.Length + newNode.HigherInterval.Length - longestInterval.Length);
            insertIntoSortedList(null, longestInterval, newNode.LowerInterval);
            insertIntoSortedList(null, longestInterval, newNode.HigherInterval);
            longestInterval = longestInterval.NextLongest;
        }
        labelCumulativeLength(root);

        return function(lengthParam) {
            return getParameterFromPathLength(root, lengthParam * cumulative);
        };
    }
});