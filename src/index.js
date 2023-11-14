// UTILS
import './utils/extensions.js'

import { RAPIER } from './core/rapier.js'

// CORE
import './core/MRElement.js'
import './core/System.js'
import './core/MRApp.js'
import './core/entity.js'
import './entities/Model.js'
import './entities/Light.js'

// SYSTEMS
import './component-systems/RapierPhysicsSystem.js'
import './component-systems/LayoutSystem.js'

// GEOMETRY
import './geometry/UIPlane.js'

// UI
import './UI/Button.js'
import './UI/Panel.js'
import './entities/Surface.js'
import './entities/Volume.js'

// MEDIA
import './UI/media/Image.js'

// TEXT
import './UI/Text/Font.js'
import './UI/Text/Text.js'
import './UI/Text/TextField.js'
import './UI/Text/TextEditor.js'

// UI: LAYOUT
import './entities/layout/Container.js'
import './entities/layout/Row.js'
import './entities/layout/Column.js'

//   EXPORTS
export * as THREE from 'three'

// CORE
export { default as MRElement } from './core/MRElement.js'
export { default as System } from './core/System.js'
export { default as Entity } from './core/entity.js'

// GEOMETRY
export { default as UIPlane } from './geometry/UIPlane.js'
// UI
export { default as Panel } from './UI/Panel.js'
