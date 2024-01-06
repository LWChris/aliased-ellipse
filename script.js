(() => {
    'use strict';

    const O_SIZE = 50;
    const SCALE = 10;
    const S_SIZE = O_SIZE * SCALE;

    var settings, sCanvas, oCanvas,
      settingShape,
      sliderX, sliderY,
      sliderWidth, sliderHeight,
      sliderRadius, sliderThickness,
      valueX, valueY,
      valueWidth, valueHeight,
      valueRadius, valueThickness;

    // Initializes the variables and event handlers
    const _init = function() {
        settings = document.getElementById("settings");
        sCanvas = document.getElementById("canvas-s");
        oCanvas = document.getElementById("canvas-o");
        settingShape = document.getElementById("shape");
        [sliderY, valueY] = setupSlider("y");
        [sliderX, valueX] = setupSlider("x");
        [sliderWidth, valueWidth] = setupSlider("width");
        [sliderHeight, valueHeight] = setupSlider("height");
        [sliderRadius, valueRadius] = setupSlider("radius");
        [sliderThickness, valueThickness] = setupSlider("thickness");

        drawGrid();

        settingShape.addEventListener("change", onShapeChanged);
        onShapeChanged();

        // onInputChanged for sliders is initialized in setupSlider
        onInputChanged();

        settingShape.addEventListener("change", onValueChanged);
        // onValueChanged for sliders is initialized in setupSlider
        onValueChanged();
    };

    const setupSlider = function(id) {
        const slider = document.getElementById(id);
        const value = document.getElementById("value-" + id);
        const incButton = document.getElementById("inc-" + id);
        const decButton = document.getElementById("dec-" + id);

        incButton.addEventListener("click", () => inc(slider));
        decButton.addEventListener("click", () => dec(slider));
        slider.addEventListener("input", onInputChanged);
        slider.addEventListener("input", onValueChanged);
        return [ slider, value ];
    }

    // Event handler when any increment button is clicked
    // input is the slider to increment
    const inc = function(input) {
        if (!input.disabled) {
            const value = parseInt(input.value);
            const max = parseInt(input.max);
            if (value < max) {
                input.value = value + 1;
                // This triggers onInputChanged and onValueChanged
                input.dispatchEvent(new Event("input"));
            }
        }
    }

    // Event handler when any decrement button is clicked
    // input is the slider to decrement
    const dec = function(input) {
        if (!input.disabled) {
            const value = parseInt(input.value);
            const min = parseInt(input.min);
            if (value > min) {
                input.value = value - 1;
                // This triggers onInputChanged and onValueChanged
                input.dispatchEvent(new Event("input"));
            }
        }
    }

    // Event handler when shape is changed
    // Only responsible for updating the available settings
    // For drawing, see onValueChanged
    const onShapeChanged = function() {
        const shape = settingShape.value;
        settings.className = shape;

        sliderRadius.disabled = shape !== "rectangle";
        sliderHeight.disabled = shape === "circle";
    }

    // Event handler when any slider is changed
    // Only responsible for updating the displayed value
    // For drawing, see onValueChanged
    const onInputChanged = function() {
        valueY.innerHTML = sliderY.value;
        valueX.innerHTML = sliderX.value;
        valueWidth.innerHTML = sliderWidth.value;
        valueHeight.innerHTML = sliderHeight.value;
        valueRadius.innerHTML = sliderRadius.value;
        valueThickness.innerHTML = sliderThickness.value;
    }

    // Event handler when shape or any slider is changed
    // Only responsible for drawing
    // For updating the available settings, see onShapeChanged
    // For updating the displayed value, see onInputChanged
    const onValueChanged = function() {
        const inY = parseInt(sliderY.value);
        const inX = parseInt(sliderX.value);
        const inW = parseInt(sliderWidth.value);
        const inH = parseInt(sliderHeight.value);
        const inR = parseInt(sliderRadius.value);
        const inT = parseInt(sliderThickness.value);
        const shape = settingShape.value;

        switch (shape) {
            case "rectangle":
                drawRectangle(inX, inY, inW, inH, inR, inT);
                break;
            case "ellipse":
                drawEllipse(inX, inY, inW, inH, inT);
                break;
            case "circle":
                drawCircle(inX, inY, inW, inT);
                break;
        }
    }

    // Gets the top left quadrant stroke and fill points of a rounded rectangle
    // x, y: top left of rectangle bounding box
    // w, h: width and height of rectangle bounding box
    // r: corner radius
    // t: stroke thickness
    const getRectangle = function(x, y, w, h, r, t) {
        const maxW = w / 2;
        const maxH = h / 2;

        const maxX = Math.min(maxW, O_SIZE - x);
        const maxY = Math.min(maxH, O_SIZE - y);

        if (r <= 1) {
            const stroke = [];
            const fill = [];

            for (let yi = 0; yi < maxY; ++yi) {
                for (let xi = 0; xi < maxX; ++xi) {
                    if (xi < t || yi < t) {
                        if (r === 0 || xi + yi > 0) {
                            stroke.push({ x: xi, y: yi });
                        }
                    } else {
                        fill.push({ x: xi, y: yi });
                    }
                }
            }

            return { stroke: stroke, fill: fill };
        }

        const wCorner = Math.min(r, maxW);
        const hCorner = Math.min(r, maxH);
        const { stroke, fill } = getEllipse(0, 0, wCorner * 2, hCorner * 2, t);

        for (let yi = hCorner; yi < maxY; ++yi) {
            for (let xi = 0; xi < maxX; ++xi) {
                if (xi < t || yi < t) {
                    stroke.push({ x: xi, y: yi });
                } else {
                    fill.push({ x: xi, y: yi });
                }
            }
        }

        for (let xi = wCorner; xi < maxX; ++xi) {
            for (let yi = 0; yi < hCorner; ++yi) {
                if (yi < t) {
                    stroke.push({ x: xi, y: yi });
                } else {
                    fill.push({ x: xi, y: yi });
                }
            }
        }

        return { stroke: stroke, fill: fill };
    }

    // Gets the top left quadrant stroke and fill points of an ellipse
    // x, y: top left of ellipse bounding box
    // w, h: width and height of ellipse bounding box
    // t: stroke thickness
    const getEllipse = function(x, y, w, h, t) {
        if (h === 0 || w === 0) {
            return { stroke: [], fill: [] };
        }

        const hasStroke = t > 0;

        if (h <= 2 || w <= 2) {
            const points = [];
            for (let xi = 0; xi < w / 2; ++xi) {
                for (let yi = 0; yi < h / 2; ++yi) {
                    points.push({ x: xi, y: yi });
                }
            }
            if (hasStroke) {
                return { stroke: points, fill: [] };
            } else {
                return { stroke: [], fill: points };
            }
        }

        const hasFill = (w / 2) > t && (h / 2) > t;

        if (w <= 4 || h <= 4) {
            const outer = [];
            const inner = [];
            for (let xi = 0; xi < w / 2; ++xi) {
                for (let yi = 0; yi < h / 2; ++yi) {
                    const yb = yi === 0 || yi === h - 1;
                    const xb = xi === 0 || xi === w - 1;

                    if (xb && yb) {
                        continue;
                    } else if (xb || yb) {
                        outer.push({ x: xi, y: yi });
                    } else {
                        inner.push({ x: xi, y: yi });
                    }
                }
            }
            if (hasStroke && hasFill) {
                return { stroke: outer, fill: inner };
            } else {
                const points = outer.concat(inner);
                if (hasStroke) {
                    return { stroke: points, fill: [] };
                } else {
                    return { stroke: [], fill: points };
                }
            }
        }

        if (!hasStroke || !hasFill) {
            t = 1;
        }

        const cx = (w - 1) / 2;
        const cy = (h - 1) / 2;

        const af = cx + 1 - t;
        const bf = cy + 1 - t;
        const aso = cx;
        const bso = cy;
        const asi = cx - 2;
        const bsi = cy - 2;

        const af_2 = af * af;
        const bf_2 = bf * bf;
        const aso_2 = aso * aso;
        const bso_2 = bso * bso;
        const asi_2 = asi * asi;
        const bsi_2 = bsi * bsi;

        const maxX = Math.min(w / 2, O_SIZE - x);
        const maxY = Math.min(h / 2, O_SIZE - y);

        const strokeBoundary = new Array(Math.ceil(maxY));
        const stroke = [];
        const fill = [];

        for (let yi = 0; yi < maxY; ++yi) {
            strokeBoundary[yi] = Array(Math.ceil(maxX)).fill(false);

            const y0 = yi - cy;
            const y0_2 = y0 * y0;
            const y0_2_bf_2 = y0_2 / bf_2;
            const y0_2_bso_2 = y0_2 / bso_2;
            const y0_2_bsi_2 = y0_2 / bsi_2;

            for (let xi = 0; xi < maxX; ++xi) {
                const x0 = xi - cx;
                const x0_2 = x0 * x0;
                const x0_2_af_2 = x0_2 / af_2;
                const x0_2_aso_2 = x0_2 / aso_2;
                const x0_2_asi_2 = x0_2 / asi_2;

                const isFill = x0_2_af_2 + y0_2_bf_2 < 1;
                const isStroke = x0_2_aso_2 + y0_2_bso_2 < 1;
                const isBoundary = x0_2_asi_2 + y0_2_bsi_2 >= 1;

                if (isFill) {
                    if (hasFill) {
                        fill.push({ x: xi, y: yi });
                    } else {
                        strokeBoundary[yi][xi] = true;
                        stroke.push({ x: xi, y: yi });
                    }
                }
                if (isStroke) {
                    strokeBoundary[yi][xi] = isBoundary;
                    if (!isFill && hasStroke) {
                        stroke.push({ x: xi, y: yi });
                    }
                }
            }
        }

        if (w <= 6 || h <= 6) {
            for (let s of stroke) {
                strokeBoundary[s.y][s.x] = true;
            }
            for (let f of fill) {
                strokeBoundary[f.y][f.x] = true;
            }
        }

        const add = hasStroke ? stroke : fill;

        for (let yi = 1; yi < maxY; ++yi) {
            for (let xi = 1; xi < maxX; ++xi) {
                if (strokeBoundary[yi][xi]) {
                    if (!strokeBoundary[yi - 1][xi]) {
                        add.push({ x: xi, y: yi - 1 });
                        strokeBoundary[yi - 1][xi] = true;
                    }
                    if (!strokeBoundary[yi][xi - 1]) {
                        add.push({ x: xi - 1, y: yi });
                        strokeBoundary[yi][xi - 1] = true;
                    }
                }
            }
        }

        return { stroke: stroke, fill: fill };
    }

    // Draws a rounded rectangle
    // x, y: top left of rectangle bounding box
    // w, h: width and height of rectangle bounding box
    // r: corner radius
    // t: stroke thickness
    const drawRectangle = function(x, y, w, h, r, t) {
        const { stroke, fill } = getRectangle(x, y, w, h, r, t);
        draw(x, y, w, h, stroke, fill);
    }

    // Draws an ellipse
    // x, y: top left of ellipse bounding box
    // w, h: width and height of ellipse bounding box
    // t: stroke thickness
    const drawEllipse = function(x, y, w, h, t) {
        const { stroke, fill } = getEllipse(x, y, w, h, t);
        draw(x, y, w, h, stroke, fill);
    }

    // Draws a circle
    // x, y: top left of circle bounding box
    // s: side lengths of circle bounding box
    // t: stroke thickness
    const drawCircle = function(x, y, s, t) {
        const { stroke, fill } = getEllipse(x, y, s, s, t);
        draw(x, y, s, s, stroke, fill);
    }

    // Colors a pixel in the original canvas
    // and the corresponding square of pixels in the scaled canvas
    // r, g, b: color values
    // sImageData: scaled canvas image data
    // oImageData: original canvas image data
    // x, y: pixel to color
    const color = function(r, g, b, sImageData, oImageData, x, y) {
        if (x < 0 || x >= O_SIZE || y < 0 || y >= O_SIZE) {
            return;
        }

        // RGB values are added instead of set
        // so overlaps would become apparent as white spots

        const oIndex = (x + y * O_SIZE) * 4;
        oImageData.data[oIndex] += r;
        oImageData.data[oIndex + 1] += g;
        oImageData.data[oIndex + 2] += b;
        oImageData.data[oIndex + 3] = 255;

        const xs = x * SCALE;
        const ys = y * SCALE;
        for (let xi = xs; xi < xs + SCALE; ++xi) {
            for (let yi = ys; yi < ys + SCALE; ++yi) {
                const sIndex = (xi + yi * S_SIZE) * 4;
                sImageData.data[sIndex] += r;
                sImageData.data[sIndex + 1] += g;
                sImageData.data[sIndex + 2] += b;
                sImageData.data[sIndex + 3] = 255;
            }
        }
    }

    // Colors a pixel in the top left quadrant
    // and its symmetric counterparts in the other quadrants
    // r, g, b: pixel color
    // sImageData: scaled canvas image data
    // oImageData: original canvas image data
    // xo, yo: pixel to color in top left quadrant
    // x, y: top left of shape bounding box
    // w, h: width and height of shape bounding box
    const colorSymmetric = function(r, g, b, sImageData, oImageData, xo, yo, x, y, w, h) {
        const xi = w - xo - 1 + x;
        const yi = h - yo - 1 + y;
        xo += x;
        yo += y;

        color(r, g, b, sImageData, oImageData, xo, yo);

        if (xi !== xo) {
            color(r, g, b, sImageData, oImageData, xi, yo);
            if (yi !== yo) {
                color(r, g, b, sImageData, oImageData, xo, yi);
                color(r, g, b, sImageData, oImageData, xi, yi);
            }
        } else if (yi !== yo) {
            color(r, g, b, sImageData, oImageData, xo, yi);
        }
    }

    // Draws a full shape in the scaled and original canvases
    // based on the stroke and fill points in the top left quadrant
    // x, y: top left of shape bounding box
    // w, h: width and height of shape bounding box
    // stroke: stroke points in top left quadrant
    // fill: fill points in top left quadrant
    const draw = function(x, y, w, h, stroke, fill) {
        const sCtx = sCanvas.getContext("2d");
        sCtx.clearRect(0, 0, S_SIZE, S_SIZE);
        const sImageData = sCtx.createImageData(S_SIZE, S_SIZE);

        const oCtx = oCanvas.getContext("2d");
        oCtx.clearRect(0, 0, O_SIZE, O_SIZE);
        const oImageData = oCtx.createImageData(O_SIZE, O_SIZE);

        for (let s of stroke) {
            colorSymmetric(0, 128, 255, sImageData, oImageData, s.x, s.y, x, y, w, h);
        }

        for (let f of fill) {
            colorSymmetric(255, 127, 0, sImageData, oImageData, f.x, f.y, x, y, w, h);
        }

        sCtx.putImageData(sImageData, 0, 0);
        oCtx.putImageData(oImageData, 0, 0);
    }

    const drawGrid = function() {
        // Horizontal grid lines
        const hGrid = document.getElementById("h-grid");
        const hCtx = hGrid.getContext("2d");

        const hLine = hCtx.createImageData(S_SIZE, 1);
        for (let x = 0; x < S_SIZE; ++x) {
            const c = 255 * (1 - (x % 2));
            const index = x * 4;
            hLine.data[index] = c;
            hLine.data[index + 1] = c;
            hLine.data[index + 2] = c;
            hLine.data[index + 3] = 127;
        }
        for (let y = SCALE - 1; y < S_SIZE; y += SCALE) {
            hCtx.putImageData(hLine, 0, y);
        }

        // Vertical grid lines
        const vGrid = document.getElementById("v-grid");
        const vCtx = vGrid.getContext("2d");

        const vLine = vCtx.createImageData(1, S_SIZE);
        for (let y = 0; y < S_SIZE; ++y) {
            const c = 255 * (1 - (y % 2));
            const index = y * 4;
            vLine.data[index] = c;
            vLine.data[index + 1] = c;
            vLine.data[index + 2] = c;
            vLine.data[index + 3] = 127;
        }
        for (let x = SCALE - 1; x < S_SIZE; x += SCALE) {
            vCtx.putImageData(vLine, x, 0);
        }
    }

    _init();
}).bind(null)();