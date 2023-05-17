import Panel from './Panel.js'
import HTMLTexture from '../textures/HTMLTexture.js'
import KeyboardInput from '../interaction/KeyboardInput.js'

class TextAreaPanel extends Panel {
    constructor(){
        super()

        this.textAreaDiv = document.createElement('div')
        this.KeyboardInput = new KeyboardInput(this.textAreaDiv)
    }

    connected(){
        document.body.append(this.textAreaDiv)
        this.createTexture()

        this.addEventListener( 'mousedown', this.onEvent );
		this.addEventListener( 'mousemove', this.onEvent );
		this.addEventListener( 'mouseup', this.onEvent );
		this.addEventListener( 'click', this.onEvent );

        document.addEventListener( 'keydown', (event) => {
            console.log('keydown');
            event.preventDefault()
            this.KeyboardInput.handleInput(event)
        });

    }

    onEvent = (event) => {
        console.log('click');
        this.object3D.material.map.dispatchDOMEvent( event );
    }

    createTexture(){
		let width = this.width * 256
		let height = this.height * 256
        let texture = new HTMLTexture( this.textAreaDiv, width, height);

        this.textAreaDiv.setAttribute('contenteditable', true)
		this.textAreaDiv.setAttribute('style', `width: ${width}px;
                                    height: ${height}px;
                                    padding: 10px;
                                    display: block;
                                    white-space: pre-wrap;
                                    overflow: scroll;
									background-color: ${this.color ? this.color : '#fff'}`)

        if (this.object3D.material) {
            this.object3D.material.map = texture
        } else {
            this.object3D.material = new MeshBasicMaterial( { map: texture, toneMapped: false, transparent: true } );
        }
    }

}

customElements.get('mr-textarea') || customElements.define('mr-textarea', TextAreaPanel);