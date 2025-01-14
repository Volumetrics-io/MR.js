import { Text } from 'troika-three-text';

import { MRDivEntity } from 'mrjs/core/entities/MRDivEntity';

/**
 * @class MRTextEntity
 * @classdesc The text element that is used to represent normal HTML text one would expect in a web browser.
 *            Used specifically on `mr-div` items.
 *            Inherits from MRDivEntity.
 * @augments MRDivEntity
 */
export class MRTextEntity extends MRDivEntity {
    /**
     * @class
     * @description Constructor for the MRTextEntity object.
     *              Sets up the 3D aspect of the text, including the object, texture, and update check.
     *              Additionally, adds an event listener for the text to auto-augment whenever the panel size changes.
     */
    constructor() {
        super();
        this.textObj = new Text();
        this.object3D.add(this.textObj);
        this.object3D.name = 'textObj';
        this.editable = false;

        this.textObj.receiveShadow = true;

        // This event listener is added so anytime a panel changes (resize, etc), the text changes
        // accordingly
        document.addEventListener('panelupdate', () => {
            this.triggerGeometryStyleUpdate();
            this.triggerTextStyleUpdate();
        });

        document.addEventListener('font-loaded', () => {
            this.triggerGeometryStyleUpdate();
            this.triggerTextStyleUpdate();
        });
    }

    /**
     * @function
     * @description Helper for anytime text is manually touched - in connected and by use of `innerText`.
     * Handles setting `innerText` like expected, sanitizing it for our use, and also making sure the updates are called.
     */
    _textWasManuallyUpdated() {
        const text = this.textContent
            .replace(/(\n)\s+/g, '$1')
            .replace(/(\r\n|\n|\r)/gm, ' ')
            .trim();
        this.textObj.text = text.length > 0 ? text : ' ';
        this.triggerGeometryStyleUpdate();
        this.triggerTextStyleUpdate();
    }

    /**
     * @function
     * @description setter capture. Handles setting `innerText` like expected by also making sure it's sanitized and the updates are called.
     */
    set innerText(newText) {
        this.textContent = newText;
        this._textWasManuallyUpdated();
    }

    /**
     * @function
     * @description (async) sets up the textObject of the text item.
     */
    async connected() {
        await super.connected();
        this._textWasManuallyUpdated();
    }

    /**
     * @function
     * @description Triggers a system run to update text specifically for the entity calling it. Useful when it's not an overall scene event and for cases where
     * relying on an overall scene or all items to update isnt beneficial.
     */
    triggerTextStyleUpdate() {
        this.dispatchEvent(new CustomEvent('trigger-text-style-update', { detail: this, bubbles: true }));
    }

    /**
     * @function
     * @description Helper method for debugging the textObj visual information
     * @param {object} textObj - the textobj threejs renderable visual. Handled by troika.
     * If no object is passed, defers to the textObj within this entity.
     */
    printCurrentTextDebugInfo(textObj) {
        if (!textObj) {
            const textDebugObj = {
                anchorX: this.textObj.anchorX,
                anchorY: this.textObj.anchorY,
                colorRanges: this.textObj.colorRanges,
                curveRadius: this.textObj.curveRadius,
                customDepthMaterials: this.textObj.customDepthMaterials,
                customDistanceMaterials: this.textObj.customDistanceMaterials,
                direction: this.textObj.direction,
                font: this.textObj.font,
                fontSize: this.textObj.fontSize,
                fontStyle: this.textObj.fontStyle,
                fontWeight: this.textObj.fontWeight,
                glyphGeometryDetail: this.textObj.glyphGeometryDetail,
                lang: this.textObj.lang,
                letterSpacing: this.textObj.letterSpacing,
                lineHeight: this.textObj.lineHeight,
                material: this.textObj.material,
                maxWidth: this.textObj.maxWidth,
                overflowWrap: this.textObj.overflowWrap,
                sdfGlyphSize: this.textObj.sdfGlyphSize,
                text: this.textObj.text,
                textAlign: this.textObj.textAlign,
                textIndent: this.textObj.textIndent,
                textRenderInfo: this.textObj.textRenderInfo,
                whiteSpace: this.textObj.whiteSpace,
            };
            console.log('textDebugInfo: ', textDebugObj);
            return;
        }

        const textDebugObj = {
            anchorX: textObj.anchorX,
            anchorY: textObj.anchorY,
            colorRanges: textObj.colorRanges,
            curveRadius: textObj.curveRadius,
            customDepthMaterials: textObj.customDepthMaterials,
            customDistanceMaterials: textObj.customDistanceMaterials,
            direction: textObj.direction,
            font: textObj.font,
            fontSize: textObj.fontSize,
            fontStyle: textObj.fontStyle,
            fontWeight: textObj.fontWeight,
            glyphGeometryDetail: textObj.glyphGeometryDetail,
            lang: textObj.lang,
            letterSpacing: textObj.letterSpacing,
            lineHeight: textObj.lineHeight,
            material: textObj.material,
            maxWidth: textObj.maxWidth,
            overflowWrap: textObj.overflowWrap,
            sdfGlyphSize: textObj.sdfGlyphSize,
            text: textObj.text,
            textAlign: textObj.textAlign,
            textIndent: textObj.textIndent,
            textRenderInfo: textObj.textRenderInfo,
            whiteSpace: textObj.whiteSpace,
        };
        console.log('textDebugInfo: ', textDebugObj);
    }
}

customElements.get('mr-text') || customElements.define('mr-text', MRTextEntity);
