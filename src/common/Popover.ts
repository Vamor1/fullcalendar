
/* A rectangular panel that is absolutely positioned over other content
------------------------------------------------------------------------------------------------------------------------
Options:
  - className (string)
  - content (HTML string, element, or element array)
  - parentEl
  - top
  - left
  - right (the x coord of where the right edge should be. not a "CSS" right)
  - autoHide (boolean)
  - show (callback)
  - hide (callback)
*/

import { getScrollParent } from '../util'
import { listenViaDelegation, ElementContent, removeElement, makeElement } from '../util/dom'
import { default as ListenerMixin, ListenerInterface } from './ListenerMixin'

export interface PopoverOptions {
  className?: string
  content?: ElementContent
  parentEl: HTMLElement
  autoHide?: boolean
  top?: number
  left?: number
  right?: number
  viewportConstrain?: boolean
}

export default class Popover {

  listenTo: ListenerInterface['listenTo']
  stopListeningTo: ListenerInterface['stopListeningTo']

  isHidden: boolean = true
  options: PopoverOptions
  el: HTMLElement // the container element for the popover. generated by this object
  margin: number = 10 // the space required between the popover and the edges of the scroll container


  constructor(options: PopoverOptions) {
    this.options = options
  }


  // Shows the popover on the specified position. Renders it if not already
  show() {
    if (this.isHidden) {
      if (!this.el) {
        this.render()
      }
      this.el.style.display = ''
      this.position()
      this.isHidden = false
      this.trigger('show')
    }
  }


  // Hides the popover, through CSS, but does not remove it from the DOM
  hide() {
    if (!this.isHidden) {
      this.el.style.display = 'none'
      this.isHidden = true
      this.trigger('hide')
    }
  }


  // Creates `this.el` and renders content inside of it
  render() {
    let options = this.options
    let el = this.el = makeElement('div', {
      className: 'fc-popover ' + (options.className || ''),
      style: {
        top: '0',
        left: '0'
      }
    }, options.content)

    options.parentEl.appendChild(el)

    // when a click happens on anything inside with a 'fc-close' className, hide the popover
    listenViaDelegation(el, 'click', 'fc-close', (ev) => {
      this.hide()
    })

    if (options.autoHide) {
      this.listenTo(document, 'mousedown', this.documentMousedown)
    }
  }


  // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
  documentMousedown(ev) {
    // only hide the popover if the click happened outside the popover
    if (this.el && !this.el.contains(ev.target)) {
      this.hide()
    }
  }


  // Hides and unregisters any handlers
  removeElement() {
    this.hide()

    if (this.el) {
      removeElement(this.el)
      this.el = null
    }

    this.stopListeningTo(document, 'mousedown')
  }


  // Positions the popover optimally, using the top/left/right options
  position() {
    let options = this.options
    let el = this.el
    let rect = el.getBoundingClientRect()
    let scrollEl = getScrollParent(el)
    let viewportRect
    let top // the "position" (not "offset") values for the popover
    let left //

    // compute top and left
    top = options.top || 0
    if (options.left !== undefined) {
      left = options.left
    } else if (options.right !== undefined) {
      left = options.right - rect.width // derive the left value from the right value
    } else {
      left = 0
    }

    if (scrollEl) {
      viewportRect = scrollEl.getBoundingClientRect()
    } else {
      viewportRect = {
        top: 0,
        left: 0,
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      }
    }

    // constrain to the view port. if constrained by two edges, give precedence to top/left
    if (options.viewportConstrain !== false) {
      top = Math.min(top, viewportRect.top + viewportRect.height - rect.height - this.margin)
      top = Math.max(top, viewportRect.top + this.margin)
      left = Math.min(left, viewportRect.left + viewportRect.width - rect.width - this.margin)
      left = Math.max(left, viewportRect.left + this.margin)
    }

    el.style.top = (top - rect.top) + 'px'
    el.style.left = (left - rect.left) + 'px'
  }


  // Triggers a callback. Calls a function in the option hash of the same name.
  // Arguments beyond the first `name` are forwarded on.
  // TODO: better code reuse for this. Repeat code
  trigger(name) {
    if (this.options[name]) {
      this.options[name].apply(this, Array.prototype.slice.call(arguments, 1))
    }
  }

}

ListenerMixin.mixInto(Popover)
