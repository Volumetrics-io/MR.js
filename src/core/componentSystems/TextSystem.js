import { getSelectionRects, preloadFont } from 'troika-three-text';

import { MRButtonEntity } from 'mrjs/core/entities/MRButtonEntity';
import { MREntity } from 'mrjs/core/MREntity';
import { MRSystem } from 'mrjs/core/MRSystem';
import { MRTextEntity } from 'mrjs/core/entities/MRTextEntity';
import { MRTextInputEntity } from 'mrjs/core/entities/MRTextInputEntity';
import { MRTextFieldEntity } from 'mrjs/core/entities/MRTextFieldEntity';
import { MRTextAreaEntity } from 'mrjs/core/entities/MRTextAreaEntity';

import { mrjsUtils } from 'mrjs';

/**
 * @class TextSystem
 * @classdesc Handles text creation and font rendering for `mr-text`, `mr-textfield`, and `mr-textarea` with a starting framerate of 1/30.
 * @augments MRSystem
 */
export class TextSystem extends MRSystem {
    /**
     * @class
     * @description TextSystem's default constructor
     */
    constructor() {
        super(false);

        // Setup all the preloaded fonts
        this.preloadedFonts = {};
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach((styleSheet) => {
            const cssRules = Array.from(styleSheet.cssRules);
            // all the font-faces rules
            const rulesFontFace = cssRules.filter((rule) => rule.cssText.startsWith('@font-face'));

            rulesFontFace.forEach((fontFace) => {
                const fontData = this.parseFontFace(fontFace.cssText);

                preloadFont(
                    {
                        font: fontData.src,
                    },
                    () => {
                        this.preloadedFonts[fontFace.style.getPropertyValue('font-family')] = fontData.src;
                        document.dispatchEvent(new CustomEvent('font-loaded'));
                    }
                );
            });
        });

        // Handle text style needs update
        this.app.addEventListener('trigger-text-style-update', (e) => {
            // The event has the entity stored as its detail.
            if (e.detail !== undefined) {
                this._updateSpecificEntity(e.detail);
            }
        });
    }

    /**
     * @function
     * @description When a new entity is created, adds it to the physics registry and initializes the physics aspects of the entity.
     * @param {MREntity} entity - the entity being set up
     */
    onNewEntity(entity) {
        if (!(entity instanceof MRTextEntity)) {
            return;
        }
        this.registry.add(entity);
        this._updateSpecificEntity(entity);
    }

    /**
     * @function
     * @param {object} entity - the entity that needs to be updated.
     * @description The per entity triggered update call. Handles updating all text items including updates for style and cleaning of content for special characters.
     */
    _updateSpecificEntity(entity) {
        this.checkIfTextContentChanged(entity);
        this.handleTextContentUpdate(entity);
    }

    /**
     *
     * @param {object} entity - checks if the content changed and if so, updates it to match.
     * @returns {boolean} true if the content needed to be updated, false otherwise.
     */
    checkIfTextContentChanged(entity) {
        // Add a check in case a user manually updates the text value
        let text =
            entity instanceof MRTextInputEntity
                ? entity.hiddenInput?.value ?? false
                : // troika honors newlines/white space
                  // we want to mimic h1, p, etc which do not honor these values
                  // so we have to clean these from the text
                  // ref: https://github.com/protectwise/troika/issues/289#issuecomment-1841916850
                  entity.textContent
                      .replace(/(\n)\s+/g, '$1')
                      .replace(/(\r\n|\n|\r)/gm, ' ')
                      .trim();

        if (entity.textObj.text != text) {
            entity.textObj.text = text;
            return true;
        }
        return false;
    }

    /**
     *
     * @param {object} entity - the entity whose content updated.
     */
    handleTextContentUpdate(entity) {
        this.updateStyle(entity);

        // The sync step ensures troika's text render info and geometry is up to date
        // with any text content changes.
        entity.textObj.sync(() => {
            if (entity instanceof MRButtonEntity) {
                // MRButtonEntity

                entity.textObj.anchorX = 'center';
            } else if (entity instanceof MRTextInputEntity) {
                // MRTextAreaEntity, MRTextFieldEntity, etc

                // -- textObj positioning and dimensions -- //
                entity.textObj.maxWidth = entity.width;
                entity.textObj.maxHeight = entity.height;
                entity.textObj.position.setX(-entity.width / 2);
                entity.textObj.position.setY(entity.height / 2);

                // -- background positioning and dimensions -- //
                // Always want background to be slightly bigger for input field 'niceness', but
                // we dont want this to be specifically based on the margin since the user might
                // have other purposes for the margin css attribute.
                entity.background.scale.x = entity.textObj.scale.x + mrjsUtils.css.pxToThree(30);
                entity.background.scale.y = entity.textObj.scale.y + mrjsUtils.css.pxToThree(30);

                if (entity instanceof MRTextAreaEntity) {
                    // XXX - add scrolling logic in here for areas where text is greater than
                    // the width/domain the user creates visually
                    //
                    // XXX - handle text wrapping properly - textarea already handles wrapping
                    // nicely, but textObj's start/end line index need to accomodate for that
                    // wrapping better. To look into: troika's setup in terms of width/height for
                    // why wrapping works nicely but the height limit for it doesnt.

                    // Handle vertical limiting dimensions - check if the start-to-end
                    // indices range need to be updated for larger or limited view.
                    //
                    // Only offsetting the end range for any changes.
                    const height = entity.cursorHeight;
                    const num_lines = Math.floor(entity.height / (entity.lineHeight * entity.textObj.fontSize));

                    const num_visual_lines = entity.verticalTextObjEndLineIndex - entity.verticalTextObjStartLineIndex + 1;
                    if (num_lines != num_visual_lines) {
                        const diff = Math.abs(num_visual_lines - num_lines) - 1;
                        if (num_lines < num_visual_lines) {
                            entity.verticalTextObjEndLineIndex = num_lines == 0 ? 0 : entity.verticalTextObjEndLineIndex - diff;
                        } else if (num_lines > num_visual_lines) {
                            entity.verticalTextObjEndLineIndex = entity.verticalTextObjStartLineIndex + diff;
                        }
                    }
                }

                // -- cursor positioning and dimensions -- //
                entity.cursorStartingPosition.x = entity.textObj.position.x;
                entity.cursorStartingPosition.y = entity.textObj.position.y - entity.textObj.fontSize / 2;

                // -- handle activity -- //
                if (entity == document.activeElement) {
                    entity.updateCursorPosition();
                } else {
                    entity.blur();
                }
            } else {
                // MRTextEntity

                entity.textObj.position.setX(-entity.width / 2);
                entity.textObj.position.setY(entity.height / 2);
            }
        });
    }

    /**
     * @function
     * @description The per global scene event update call. Handles updating all text items including updates for style and cleaning of content for special characters.
     */
    eventUpdate = () => {
        for (const entity of this.registry) {
            this.checkIfTextContentChanged(entity);
            this.handleTextContentUpdate(entity);
        }
    };

    /**
     * @function
     * @description Updates the style for the text's information based on compStyle and inputted css elements.
     * @param {MRTextEntity} entity - the text entity whose style is being updated
     */
    updateStyle = (entity) => {
        const { textObj } = entity;

        // Font
        textObj.font = textObj.text.trim().length != 0 ? this.preloadedFonts[entity.compStyle.fontFamily] : null;
        textObj.fontSize = this.parseFontSize(entity.compStyle.fontSize, entity);
        textObj.fontWeight = this.parseFontWeight(entity.compStyle.fontWeight);
        textObj.fontStyle = entity.compStyle.fontStyle;

        // Alignment
        textObj.anchorY = this.getVerticalAlign(entity.compStyle.verticalAlign, entity);
        textObj.textAlign = this.getTextAlign(entity.compStyle.textAlign);
        textObj.lineHeight = this.getLineHeight(entity.compStyle.lineHeight, entity);

        // Color and opacity
        // TODO - swap this to use the mrjsUtils.color.setObject3DColor function in future.
        // For now since that creates a weird affect for styling (white edges), leaving as the
        // current implementation. This probably just means there's a default style css thing
        // we need to change before we swap.
        this.setTextObject3DColor(textObj, entity.compStyle.color);

        // Whitespace and Wrapping
        textObj.whiteSpace = entity.compStyle.whiteSpace ?? textObj.whiteSpace;
        textObj.maxWidth = entity.width * 1.001;

        // Offset position for visibility on top of background plane
        textObj.position.z = 0.0001;
    };

    /**
     * @function
     * @description Handles when text is added as an entity updating content and style for the internal textObj appropriately.
     * @param {MRTextEntity} entity - the text entity being updated
     */
    addText = (entity) => {
        const text = entity.textContent.trim();
        entity.textObj.text = text.length > 0 ? text : ' ';

        this.updateStyle(entity);
    };

    /**
     * @function
     * @description parses the font weight as 'bold', 'normal', etc based on the given weight value
     * @param {number} weight - the numerical representation of the font-weight
     * @returns {string} - the enum of 'bold', 'normal', etc
     */
    parseFontWeight(weight) {
        if (weight >= 500) {
            return 'bold';
        }
        return 'normal';
    }

    /**
     * @function
     * @description parses the font size based on its `XXpx` value and converts it to a usable result based on the virtual display resolution
     * @param {number} val - the value being adjusted
     * @param {object} el - the css element handler
     * @returns {number} - the font size adjusted for the display as expected
     */
    parseFontSize(val, el) {
        const result = parseFloat(val.split('px')[0]) / mrjsUtils.display.VIRTUAL_DISPLAY_RESOLUTION;
        return result;
    }

    /**
     * @function
     * @description Gets the vertical align
     * @param {number} verticalAlign - the numerical representation in pixel space of the vertical Align
     * @param {MREntity} entity - the entity whose comp style (css) is relevant
     * @returns {string} - the string representation of the the verticalAlign
     */
    getVerticalAlign(verticalAlign, entity) {
        let result = verticalAlign;

        if (typeof result === 'number') {
            result /= mrjsUtils.css.pxToThree(entity.compStyle.fontSize);
        }

        switch (result) {
            case 'baseline':
            case 'sub':
            case 'super':
                return 0;
            case 'text-top':
                return 'top-ex';
            case 'text-bottom':
                return 'bottom';
            case 'middle':
            default:
                return result;
        }
    }

    /**
     * @function
     * @description Gets the line height
     * @param {number} lineHeight - the numerical representation in pixel space of the line height
     * @param {MREntity} entity - the entity whose comp style (css) is relevant
     * @returns {number} - the numerical representation of the the lineHeight
     */
    getLineHeight(lineHeight, entity) {
        let result = mrjsUtils.css.pxToThree(lineHeight);

        if (typeof result === 'number') {
            result /= mrjsUtils.css.pxToThree(entity.compStyle.fontSize);
        }

        return result;
    }

    /**
     * @function
     * @description Gets the text alignment string
     * @param {string} textAlign - handles values for `start`, `end`, `left`, and `right`; otherwise, defaults to the same input as `textAlign`.
     * @returns {string} - the resolved `textAlign`.
     */
    getTextAlign(textAlign) {
        if (textAlign == 'start') {
            return 'left';
        } else if (textAlign == 'end') {
            return 'right';
        }
        return textAlign;
    }

    /**
     * @function
     * @description Based on the given font-face value in the passed cssString, tries to either use by default or download the requested font-face
     *              for use by the text object.
     * @param {string} cssString - the css string to be parsed for the font-face css value.
     * @returns {object} - json object respresenting the preloaded font-face
     */
    parseFontFace(cssString) {
        const obj = {};
        const match = cssString.match(/@font-face\s*{\s*([^}]*)\s*}/);

        if (match) {
            const fontFaceAttributes = match[1];
            const attributes = fontFaceAttributes.split(';');

            attributes.forEach((attribute) => {
                const [key, value] = attribute.split(':').map((item) => item.trim());
                if (key === 'src') {
                    const urlMatch = value.match(/url\("([^"]+)"\)/);
                    if (urlMatch) {
                        obj[key] = urlMatch[1];
                    }
                } else {
                    obj[key] = value;
                }
            });
        }

        return obj;
    }

    /**
     * @function
     * @description Sets the text object3D color.
     * @param {object} object3D - the threejs object representation of the troika textt to be colored
     * @param {string} color - the string representation of the color in rgba, hex, or name ('red') form
     * @param {string} default_color - fallback color used if the system does not understand the color parameter. Defaults to black.
     */
    setTextObject3DColor = function (object3D, color, default_color = '#000') {
        if (color.includes('rgba')) {
            const rgba = color
                .substring(5, color.length - 1)
                .split(',')
                .map((part) => parseFloat(part.trim()));
            object3D.material.color.setStyle(`rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`);

            object3D.material.opacity = rgba[3];
        } else {
            object3D.material.color.setStyle(color ?? '#000');
        }
        object3D.material.needsUpdate = true;
    };
}
