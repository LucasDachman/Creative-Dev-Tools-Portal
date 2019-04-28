/*!
 * parallax-music v0.0.1
 * parallax scrolling with music
 * (c) 2019 Lucas Dachman
 * MIT License
 * 
 */

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
* svg.js - A lightweight library for manipulating and animating SVG.
* @version 2.7.1
* https://svgdotjs.github.io/
*
* @copyright Wout Fierens <wout@mick-wout.com>
* @license MIT
*
* BUILT: Fri Nov 30 2018 10:01:55 GMT+0100 (GMT+01:00)
*/;
(function(root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    define(function(){
      return factory(root, root.document)
    })
  } else if (typeof exports === 'object') {
    module.exports = root.document ? factory(root, root.document) : function(w){ return factory(w, w.document) }
  } else {
    root.SVG = factory(root, root.document)
  }
}(typeof window !== "undefined" ? window : this, function(window, document) {

// Find global reference - uses 'this' by default when available,
// falls back to 'window' otherwise (for bundlers like Webpack)
var globalRef = (typeof this !== "undefined") ? this : window;

// The main wrapping element
var SVG = globalRef.SVG = function(element) {
  if (SVG.supported) {
    element = new SVG.Doc(element)

    if(!SVG.parser.draw)
      SVG.prepare()

    return element
  }
}

// Default namespaces
SVG.ns    = 'http://www.w3.org/2000/svg'
SVG.xmlns = 'http://www.w3.org/2000/xmlns/'
SVG.xlink = 'http://www.w3.org/1999/xlink'
SVG.svgjs = 'http://svgjs.com/svgjs'

// Svg support test
SVG.supported = (function() {
  return !! document.createElementNS &&
         !! document.createElementNS(SVG.ns,'svg').createSVGRect
})()

// Don't bother to continue if SVG is not supported
if (!SVG.supported) return false

// Element id sequence
SVG.did  = 1000

// Get next named element id
SVG.eid = function(name) {
  return 'Svgjs' + capitalize(name) + (SVG.did++)
}

// Method for element creation
SVG.create = function(name) {
  // create element
  var element = document.createElementNS(this.ns, name)

  // apply unique id
  element.setAttribute('id', this.eid(name))

  return element
}

// Method for extending objects
SVG.extend = function() {
  var modules, methods, key, i

  // Get list of modules
  modules = [].slice.call(arguments)

  // Get object with extensions
  methods = modules.pop()

  for (i = modules.length - 1; i >= 0; i--)
    if (modules[i])
      for (key in methods)
        modules[i].prototype[key] = methods[key]

  // Make sure SVG.Set inherits any newly added methods
  if (SVG.Set && SVG.Set.inherit)
    SVG.Set.inherit()
}

// Invent new element
SVG.invent = function(config) {
  // Create element initializer
  var initializer = typeof config.create == 'function' ?
    config.create :
    function() {
      this.constructor.call(this, SVG.create(config.create))
    }

  // Inherit prototype
  if (config.inherit)
    initializer.prototype = new config.inherit

  // Extend with methods
  if (config.extend)
    SVG.extend(initializer, config.extend)

  // Attach construct method to parent
  if (config.construct)
    SVG.extend(config.parent || SVG.Container, config.construct)

  return initializer
}

// Adopt existing svg elements
SVG.adopt = function(node) {
  // check for presence of node
  if (!node) return null

  // make sure a node isn't already adopted
  if (node.instance) return node.instance

  // initialize variables
  var element

  // adopt with element-specific settings
  if (node.nodeName == 'svg')
    element = node.parentNode instanceof window.SVGElement ? new SVG.Nested : new SVG.Doc
  else if (node.nodeName == 'linearGradient')
    element = new SVG.Gradient('linear')
  else if (node.nodeName == 'radialGradient')
    element = new SVG.Gradient('radial')
  else if (SVG[capitalize(node.nodeName)])
    element = new SVG[capitalize(node.nodeName)]
  else
    element = new SVG.Element(node)

  // ensure references
  element.type  = node.nodeName
  element.node  = node
  node.instance = element

  // SVG.Class specific preparations
  if (element instanceof SVG.Doc)
    element.namespace().defs()

  // pull svgjs data from the dom (getAttributeNS doesn't work in html5)
  element.setData(JSON.parse(node.getAttribute('svgjs:data')) || {})

  return element
}

// Initialize parsing element
SVG.prepare = function() {
  // Select document body and create invisible svg element
  var body = document.getElementsByTagName('body')[0]
    , draw = (body ? new SVG.Doc(body) : SVG.adopt(document.documentElement).nested()).size(2, 0)

  // Create parser object
  SVG.parser = {
    body: body || document.documentElement
  , draw: draw.style('opacity:0;position:absolute;left:-100%;top:-100%;overflow:hidden').attr('focusable', 'false').node
  , poly: draw.polyline().node
  , path: draw.path().node
  , native: SVG.create('svg')
  }
}

SVG.parser = {
  native: SVG.create('svg')
}

document.addEventListener('DOMContentLoaded', function() {
  if(!SVG.parser.draw)
    SVG.prepare()
}, false)

// Storage for regular expressions
SVG.regex = {
  // Parse unit value
  numberAndUnit:    /^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i

  // Parse hex value
, hex:              /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i

  // Parse rgb value
, rgb:              /rgb\((\d+),(\d+),(\d+)\)/

  // Parse reference id
, reference:        /#([a-z0-9\-_]+)/i

  // splits a transformation chain
, transforms:       /\)\s*,?\s*/

  // Whitespace
, whitespace:       /\s/g

  // Test hex value
, isHex:            /^#[a-f0-9]{3,6}$/i

  // Test rgb value
, isRgb:            /^rgb\(/

  // Test css declaration
, isCss:            /[^:]+:[^;]+;?/

  // Test for blank string
, isBlank:          /^(\s+)?$/

  // Test for numeric string
, isNumber:         /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i

  // Test for percent value
, isPercent:        /^-?[\d\.]+%$/

  // Test for image url
, isImage:          /\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i

  // split at whitespace and comma
, delimiter:        /[\s,]+/

  // The following regex are used to parse the d attribute of a path

  // Matches all hyphens which are not after an exponent
, hyphen:           /([^e])\-/gi

  // Replaces and tests for all path letters
, pathLetters:      /[MLHVCSQTAZ]/gi

  // yes we need this one, too
, isPathLetter:     /[MLHVCSQTAZ]/i

  // matches 0.154.23.45
, numbersWithDots:  /((\d?\.\d+(?:e[+-]?\d+)?)((?:\.\d+(?:e[+-]?\d+)?)+))+/gi

  // matches .
, dots:             /\./g
}

SVG.utils = {
  // Map function
  map: function(array, block) {
    var i
      , il = array.length
      , result = []

    for (i = 0; i < il; i++)
      result.push(block(array[i]))

    return result
  }

  // Filter function
, filter: function(array, block) {
    var i
      , il = array.length
      , result = []

    for (i = 0; i < il; i++)
      if (block(array[i]))
        result.push(array[i])

    return result
  }

  // Degrees to radians
, radians: function(d) {
    return d % 360 * Math.PI / 180
  }

  // Radians to degrees
, degrees: function(r) {
    return r * 180 / Math.PI % 360
  }

, filterSVGElements: function(nodes) {
    return this.filter( nodes, function(el) { return el instanceof window.SVGElement })
  }

}

SVG.defaults = {
  // Default attribute values
  attrs: {
    // fill and stroke
    'fill-opacity':     1
  , 'stroke-opacity':   1
  , 'stroke-width':     0
  , 'stroke-linejoin':  'miter'
  , 'stroke-linecap':   'butt'
  , fill:               '#000000'
  , stroke:             '#000000'
  , opacity:            1
    // position
  , x:                  0
  , y:                  0
  , cx:                 0
  , cy:                 0
    // size
  , width:              0
  , height:             0
    // radius
  , r:                  0
  , rx:                 0
  , ry:                 0
    // gradient
  , offset:             0
  , 'stop-opacity':     1
  , 'stop-color':       '#000000'
    // text
  , 'font-size':        16
  , 'font-family':      'Helvetica, Arial, sans-serif'
  , 'text-anchor':      'start'
  }

}
// Module for color convertions
SVG.Color = function(color) {
  var match

  // initialize defaults
  this.r = 0
  this.g = 0
  this.b = 0

  if(!color) return

  // parse color
  if (typeof color === 'string') {
    if (SVG.regex.isRgb.test(color)) {
      // get rgb values
      match = SVG.regex.rgb.exec(color.replace(SVG.regex.whitespace,''))

      // parse numeric values
      this.r = parseInt(match[1])
      this.g = parseInt(match[2])
      this.b = parseInt(match[3])

    } else if (SVG.regex.isHex.test(color)) {
      // get hex values
      match = SVG.regex.hex.exec(fullHex(color))

      // parse numeric values
      this.r = parseInt(match[1], 16)
      this.g = parseInt(match[2], 16)
      this.b = parseInt(match[3], 16)

    }

  } else if (typeof color === 'object') {
    this.r = color.r
    this.g = color.g
    this.b = color.b

  }

}

SVG.extend(SVG.Color, {
  // Default to hex conversion
  toString: function() {
    return this.toHex()
  }
  // Build hex value
, toHex: function() {
    return '#'
      + compToHex(this.r)
      + compToHex(this.g)
      + compToHex(this.b)
  }
  // Build rgb value
, toRgb: function() {
    return 'rgb(' + [this.r, this.g, this.b].join() + ')'
  }
  // Calculate true brightness
, brightness: function() {
    return (this.r / 255 * 0.30)
         + (this.g / 255 * 0.59)
         + (this.b / 255 * 0.11)
  }
  // Make color morphable
, morph: function(color) {
    this.destination = new SVG.Color(color)

    return this
  }
  // Get morphed color at given position
, at: function(pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    // normalise pos
    pos = pos < 0 ? 0 : pos > 1 ? 1 : pos

    // generate morphed color
    return new SVG.Color({
      r: ~~(this.r + (this.destination.r - this.r) * pos)
    , g: ~~(this.g + (this.destination.g - this.g) * pos)
    , b: ~~(this.b + (this.destination.b - this.b) * pos)
    })
  }

})

// Testers

// Test if given value is a color string
SVG.Color.test = function(color) {
  color += ''
  return SVG.regex.isHex.test(color)
      || SVG.regex.isRgb.test(color)
}

// Test if given value is a rgb object
SVG.Color.isRgb = function(color) {
  return color && typeof color.r == 'number'
               && typeof color.g == 'number'
               && typeof color.b == 'number'
}

// Test if given value is a color
SVG.Color.isColor = function(color) {
  return SVG.Color.isRgb(color) || SVG.Color.test(color)
}
// Module for array conversion
SVG.Array = function(array, fallback) {
  array = (array || []).valueOf()

  // if array is empty and fallback is provided, use fallback
  if (array.length == 0 && fallback)
    array = fallback.valueOf()

  // parse array
  this.value = this.parse(array)
}

SVG.extend(SVG.Array, {
  // Make array morphable
  morph: function(array) {
    this.destination = this.parse(array)

    // normalize length of arrays
    if (this.value.length != this.destination.length) {
      var lastValue       = this.value[this.value.length - 1]
        , lastDestination = this.destination[this.destination.length - 1]

      while(this.value.length > this.destination.length)
        this.destination.push(lastDestination)
      while(this.value.length < this.destination.length)
        this.value.push(lastValue)
    }

    return this
  }
  // Clean up any duplicate points
, settle: function() {
    // find all unique values
    for (var i = 0, il = this.value.length, seen = []; i < il; i++)
      if (seen.indexOf(this.value[i]) == -1)
        seen.push(this.value[i])

    // set new value
    return this.value = seen
  }
  // Get morphed array at given position
, at: function(pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    // generate morphed array
    for (var i = 0, il = this.value.length, array = []; i < il; i++)
      array.push(this.value[i] + (this.destination[i] - this.value[i]) * pos)

    return new SVG.Array(array)
  }
  // Convert array to string
, toString: function() {
    return this.value.join(' ')
  }
  // Real value
, valueOf: function() {
    return this.value
  }
  // Parse whitespace separated string
, parse: function(array) {
    array = array.valueOf()

    // if already is an array, no need to parse it
    if (Array.isArray(array)) return array

    return this.split(array)
  }
  // Strip unnecessary whitespace
, split: function(string) {
    return string.trim().split(SVG.regex.delimiter).map(parseFloat)
  }
  // Reverse array
, reverse: function() {
    this.value.reverse()

    return this
  }
, clone: function() {
    var clone = new this.constructor()
    clone.value = array_clone(this.value)
    return clone
  }
})
// Poly points array
SVG.PointArray = function(array, fallback) {
  SVG.Array.call(this, array, fallback || [[0,0]])
}

// Inherit from SVG.Array
SVG.PointArray.prototype = new SVG.Array
SVG.PointArray.prototype.constructor = SVG.PointArray

SVG.extend(SVG.PointArray, {
  // Convert array to string
  toString: function() {
    // convert to a poly point string
    for (var i = 0, il = this.value.length, array = []; i < il; i++)
      array.push(this.value[i].join(','))

    return array.join(' ')
  }
  // Convert array to line object
, toLine: function() {
    return {
      x1: this.value[0][0]
    , y1: this.value[0][1]
    , x2: this.value[1][0]
    , y2: this.value[1][1]
    }
  }
  // Get morphed array at given position
, at: function(pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    // generate morphed point string
    for (var i = 0, il = this.value.length, array = []; i < il; i++)
      array.push([
        this.value[i][0] + (this.destination[i][0] - this.value[i][0]) * pos
      , this.value[i][1] + (this.destination[i][1] - this.value[i][1]) * pos
      ])

    return new SVG.PointArray(array)
  }
  // Parse point string and flat array
, parse: function(array) {
    var points = []

    array = array.valueOf()

    // if it is an array
    if (Array.isArray(array)) {
      // and it is not flat, there is no need to parse it
      if(Array.isArray(array[0])) {
        // make sure to use a clone
        return array.map(function (el) { return el.slice() })
      } else if (array[0].x != null){
        // allow point objects to be passed
        return array.map(function (el) { return [el.x, el.y] })
      }
    } else { // Else, it is considered as a string
      // parse points
      array = array.trim().split(SVG.regex.delimiter).map(parseFloat)
    }

    // validate points - https://svgwg.org/svg2-draft/shapes.html#DataTypePoints
    // Odd number of coordinates is an error. In such cases, drop the last odd coordinate.
    if (array.length % 2 !== 0) array.pop()

    // wrap points in two-tuples and parse points as floats
    for(var i = 0, len = array.length; i < len; i = i + 2)
      points.push([ array[i], array[i+1] ])

    return points
  }
  // Move point string
, move: function(x, y) {
    var box = this.bbox()

    // get relative offset
    x -= box.x
    y -= box.y

    // move every point
    if (!isNaN(x) && !isNaN(y))
      for (var i = this.value.length - 1; i >= 0; i--)
        this.value[i] = [this.value[i][0] + x, this.value[i][1] + y]

    return this
  }
  // Resize poly string
, size: function(width, height) {
    var i, box = this.bbox()

    // recalculate position of all points according to new size
    for (i = this.value.length - 1; i >= 0; i--) {
      if(box.width) this.value[i][0] = ((this.value[i][0] - box.x) * width)  / box.width  + box.x
      if(box.height) this.value[i][1] = ((this.value[i][1] - box.y) * height) / box.height + box.y
    }

    return this
  }
  // Get bounding box of points
, bbox: function() {
    SVG.parser.poly.setAttribute('points', this.toString())

    return SVG.parser.poly.getBBox()
  }
})

var pathHandlers = {
  M: function(c, p, p0) {
    p.x = p0.x = c[0]
    p.y = p0.y = c[1]

    return ['M', p.x, p.y]
  },
  L: function(c, p) {
    p.x = c[0]
    p.y = c[1]
    return ['L', c[0], c[1]]
  },
  H: function(c, p) {
    p.x = c[0]
    return ['H', c[0]]
  },
  V: function(c, p) {
    p.y = c[0]
    return ['V', c[0]]
  },
  C: function(c, p) {
    p.x = c[4]
    p.y = c[5]
    return ['C', c[0], c[1], c[2], c[3], c[4], c[5]]
  },
  S: function(c, p) {
    p.x = c[2]
    p.y = c[3]
    return ['S', c[0], c[1], c[2], c[3]]
  },
  Q: function(c, p) {
    p.x = c[2]
    p.y = c[3]
    return ['Q', c[0], c[1], c[2], c[3]]
  },
  T: function(c, p) {
    p.x = c[0]
    p.y = c[1]
    return ['T', c[0], c[1]]
  },
  Z: function(c, p, p0) {
    p.x = p0.x
    p.y = p0.y
    return ['Z']
  },
  A: function(c, p) {
    p.x = c[5]
    p.y = c[6]
    return ['A', c[0], c[1], c[2], c[3], c[4], c[5], c[6]]
  }
}

var mlhvqtcsa = 'mlhvqtcsaz'.split('')

for(var i = 0, il = mlhvqtcsa.length; i < il; ++i){
  pathHandlers[mlhvqtcsa[i]] = (function(i){
    return function(c, p, p0) {
      if(i == 'H') c[0] = c[0] + p.x
      else if(i == 'V') c[0] = c[0] + p.y
      else if(i == 'A'){
        c[5] = c[5] + p.x,
        c[6] = c[6] + p.y
      }
      else
        for(var j = 0, jl = c.length; j < jl; ++j) {
          c[j] = c[j] + (j%2 ? p.y : p.x)
        }

      return pathHandlers[i](c, p, p0)
    }
  })(mlhvqtcsa[i].toUpperCase())
}

// Path points array
SVG.PathArray = function(array, fallback) {
  SVG.Array.call(this, array, fallback || [['M', 0, 0]])
}

// Inherit from SVG.Array
SVG.PathArray.prototype = new SVG.Array
SVG.PathArray.prototype.constructor = SVG.PathArray

SVG.extend(SVG.PathArray, {
  // Convert array to string
  toString: function() {
    return arrayToString(this.value)
  }
  // Move path string
, move: function(x, y) {
    // get bounding box of current situation
    var box = this.bbox()

    // get relative offset
    x -= box.x
    y -= box.y

    if (!isNaN(x) && !isNaN(y)) {
      // move every point
      for (var l, i = this.value.length - 1; i >= 0; i--) {
        l = this.value[i][0]

        if (l == 'M' || l == 'L' || l == 'T')  {
          this.value[i][1] += x
          this.value[i][2] += y

        } else if (l == 'H')  {
          this.value[i][1] += x

        } else if (l == 'V')  {
          this.value[i][1] += y

        } else if (l == 'C' || l == 'S' || l == 'Q')  {
          this.value[i][1] += x
          this.value[i][2] += y
          this.value[i][3] += x
          this.value[i][4] += y

          if (l == 'C')  {
            this.value[i][5] += x
            this.value[i][6] += y
          }

        } else if (l == 'A')  {
          this.value[i][6] += x
          this.value[i][7] += y
        }

      }
    }

    return this
  }
  // Resize path string
, size: function(width, height) {
    // get bounding box of current situation
    var i, l, box = this.bbox()

    // recalculate position of all points according to new size
    for (i = this.value.length - 1; i >= 0; i--) {
      l = this.value[i][0]

      if (l == 'M' || l == 'L' || l == 'T')  {
        this.value[i][1] = ((this.value[i][1] - box.x) * width)  / box.width  + box.x
        this.value[i][2] = ((this.value[i][2] - box.y) * height) / box.height + box.y

      } else if (l == 'H')  {
        this.value[i][1] = ((this.value[i][1] - box.x) * width)  / box.width  + box.x

      } else if (l == 'V')  {
        this.value[i][1] = ((this.value[i][1] - box.y) * height) / box.height + box.y

      } else if (l == 'C' || l == 'S' || l == 'Q')  {
        this.value[i][1] = ((this.value[i][1] - box.x) * width)  / box.width  + box.x
        this.value[i][2] = ((this.value[i][2] - box.y) * height) / box.height + box.y
        this.value[i][3] = ((this.value[i][3] - box.x) * width)  / box.width  + box.x
        this.value[i][4] = ((this.value[i][4] - box.y) * height) / box.height + box.y

        if (l == 'C')  {
          this.value[i][5] = ((this.value[i][5] - box.x) * width)  / box.width  + box.x
          this.value[i][6] = ((this.value[i][6] - box.y) * height) / box.height + box.y
        }

      } else if (l == 'A')  {
        // resize radii
        this.value[i][1] = (this.value[i][1] * width)  / box.width
        this.value[i][2] = (this.value[i][2] * height) / box.height

        // move position values
        this.value[i][6] = ((this.value[i][6] - box.x) * width)  / box.width  + box.x
        this.value[i][7] = ((this.value[i][7] - box.y) * height) / box.height + box.y
      }

    }

    return this
  }
  // Test if the passed path array use the same path data commands as this path array
, equalCommands: function(pathArray) {
    var i, il, equalCommands

    pathArray = new SVG.PathArray(pathArray)

    equalCommands = this.value.length === pathArray.value.length
    for(i = 0, il = this.value.length; equalCommands && i < il; i++) {
      equalCommands = this.value[i][0] === pathArray.value[i][0]
    }

    return equalCommands
  }
  // Make path array morphable
, morph: function(pathArray) {
    pathArray = new SVG.PathArray(pathArray)

    if(this.equalCommands(pathArray)) {
      this.destination = pathArray
    } else {
      this.destination = null
    }

    return this
  }
  // Get morphed path array at given position
, at: function(pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    var sourceArray = this.value
      , destinationArray = this.destination.value
      , array = [], pathArray = new SVG.PathArray()
      , i, il, j, jl

    // Animate has specified in the SVG spec
    // See: https://www.w3.org/TR/SVG11/paths.html#PathElement
    for (i = 0, il = sourceArray.length; i < il; i++) {
      array[i] = [sourceArray[i][0]]
      for(j = 1, jl = sourceArray[i].length; j < jl; j++) {
        array[i][j] = sourceArray[i][j] + (destinationArray[i][j] - sourceArray[i][j]) * pos
      }
      // For the two flags of the elliptical arc command, the SVG spec say:
      // Flags and booleans are interpolated as fractions between zero and one, with any non-zero value considered to be a value of one/true
      // Elliptical arc command as an array followed by corresponding indexes:
      // ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
      //   0    1   2        3                 4             5      6  7
      if(array[i][0] === 'A') {
        array[i][4] = +(array[i][4] != 0)
        array[i][5] = +(array[i][5] != 0)
      }
    }

    // Directly modify the value of a path array, this is done this way for performance
    pathArray.value = array
    return pathArray
  }
  // Absolutize and parse path to array
, parse: function(array) {
    // if it's already a patharray, no need to parse it
    if (array instanceof SVG.PathArray) return array.valueOf()

    // prepare for parsing
    var i, x0, y0, s, seg, arr
      , x = 0
      , y = 0
      , paramCnt = { 'M':2, 'L':2, 'H':1, 'V':1, 'C':6, 'S':4, 'Q':4, 'T':2, 'A':7, 'Z':0 }

    if(typeof array == 'string'){

      array = array
        .replace(SVG.regex.numbersWithDots, pathRegReplace) // convert 45.123.123 to 45.123 .123
        .replace(SVG.regex.pathLetters, ' $& ') // put some room between letters and numbers
        .replace(SVG.regex.hyphen, '$1 -')      // add space before hyphen
        .trim()                                 // trim
        .split(SVG.regex.delimiter)   // split into array

    }else{
      array = array.reduce(function(prev, curr){
        return [].concat.call(prev, curr)
      }, [])
    }

    // array now is an array containing all parts of a path e.g. ['M', '0', '0', 'L', '30', '30' ...]
    var arr = []
      , p = new SVG.Point()
      , p0 = new SVG.Point()
      , index = 0
      , len = array.length

    do{
      // Test if we have a path letter
      if(SVG.regex.isPathLetter.test(array[index])){
        s = array[index]
        ++index
      // If last letter was a move command and we got no new, it defaults to [L]ine
      }else if(s == 'M'){
        s = 'L'
      }else if(s == 'm'){
        s = 'l'
      }

      arr.push(pathHandlers[s].call(null,
          array.slice(index, (index = index + paramCnt[s.toUpperCase()])).map(parseFloat),
          p, p0
        )
      )

    }while(len > index)

    return arr

  }
  // Get bounding box of path
, bbox: function() {
    SVG.parser.path.setAttribute('d', this.toString())

    return SVG.parser.path.getBBox()
  }

})

// Module for unit convertions
SVG.Number = SVG.invent({
  // Initialize
  create: function(value, unit) {
    // initialize defaults
    this.value = 0
    this.unit  = unit || ''

    // parse value
    if (typeof value === 'number') {
      // ensure a valid numeric value
      this.value = isNaN(value) ? 0 : !isFinite(value) ? (value < 0 ? -3.4e+38 : +3.4e+38) : value

    } else if (typeof value === 'string') {
      unit = value.match(SVG.regex.numberAndUnit)

      if (unit) {
        // make value numeric
        this.value = parseFloat(unit[1])

        // normalize
        if (unit[5] == '%')
          this.value /= 100
        else if (unit[5] == 's')
          this.value *= 1000

        // store unit
        this.unit = unit[5]
      }

    } else {
      if (value instanceof SVG.Number) {
        this.value = value.valueOf()
        this.unit  = value.unit
      }
    }

  }
  // Add methods
, extend: {
    // Stringalize
    toString: function() {
      return (
        this.unit == '%' ?
          ~~(this.value * 1e8) / 1e6:
        this.unit == 's' ?
          this.value / 1e3 :
          this.value
      ) + this.unit
    }
  , toJSON: function() {
      return this.toString()
    }
  , // Convert to primitive
    valueOf: function() {
      return this.value
    }
    // Add number
  , plus: function(number) {
      number = new SVG.Number(number)
      return new SVG.Number(this + number, this.unit || number.unit)
    }
    // Subtract number
  , minus: function(number) {
      number = new SVG.Number(number)
      return new SVG.Number(this - number, this.unit || number.unit)
    }
    // Multiply number
  , times: function(number) {
      number = new SVG.Number(number)
      return new SVG.Number(this * number, this.unit || number.unit)
    }
    // Divide number
  , divide: function(number) {
      number = new SVG.Number(number)
      return new SVG.Number(this / number, this.unit || number.unit)
    }
    // Convert to different unit
  , to: function(unit) {
      var number = new SVG.Number(this)

      if (typeof unit === 'string')
        number.unit = unit

      return number
    }
    // Make number morphable
  , morph: function(number) {
      this.destination = new SVG.Number(number)

      if(number.relative) {
        this.destination.value += this.value
      }

      return this
    }
    // Get morphed number at given position
  , at: function(pos) {
      // Make sure a destination is defined
      if (!this.destination) return this

      // Generate new morphed number
      return new SVG.Number(this.destination)
          .minus(this)
          .times(pos)
          .plus(this)
    }

  }
})


SVG.Element = SVG.invent({
  // Initialize node
  create: function(node) {
    // make stroke value accessible dynamically
    this._stroke = SVG.defaults.attrs.stroke
    this._event = null
    this._events = {}

    // initialize data object
    this.dom = {}

    // create circular reference
    if (this.node = node) {
      this.type = node.nodeName
      this.node.instance = this
      this._events = node._events || {}

      // store current attribute value
      this._stroke = node.getAttribute('stroke') || this._stroke
    }
  }

  // Add class methods
, extend: {
    // Move over x-axis
    x: function(x) {
      return this.attr('x', x)
    }
    // Move over y-axis
  , y: function(y) {
      return this.attr('y', y)
    }
    // Move by center over x-axis
  , cx: function(x) {
      return x == null ? this.x() + this.width() / 2 : this.x(x - this.width() / 2)
    }
    // Move by center over y-axis
  , cy: function(y) {
      return y == null ? this.y() + this.height() / 2 : this.y(y - this.height() / 2)
    }
    // Move element to given x and y values
  , move: function(x, y) {
      return this.x(x).y(y)
    }
    // Move element by its center
  , center: function(x, y) {
      return this.cx(x).cy(y)
    }
    // Set width of element
  , width: function(width) {
      return this.attr('width', width)
    }
    // Set height of element
  , height: function(height) {
      return this.attr('height', height)
    }
    // Set element size to given width and height
  , size: function(width, height) {
      var p = proportionalSize(this, width, height)

      return this
        .width(new SVG.Number(p.width))
        .height(new SVG.Number(p.height))
    }
    // Clone element
  , clone: function(parent) {
      // write dom data to the dom so the clone can pickup the data
      this.writeDataToDom()

      // clone element and assign new id
      var clone = assignNewId(this.node.cloneNode(true))

      // insert the clone in the given parent or after myself
      if(parent) parent.add(clone)
      else this.after(clone)

      return clone
    }
    // Remove element
  , remove: function() {
      if (this.parent())
        this.parent().removeElement(this)

      return this
    }
    // Replace element
  , replace: function(element) {
      this.after(element).remove()

      return element
    }
    // Add element to given container and return self
  , addTo: function(parent) {
      return parent.put(this)
    }
    // Add element to given container and return container
  , putIn: function(parent) {
      return parent.add(this)
    }
    // Get / set id
  , id: function(id) {
      return this.attr('id', id)
    }
    // Checks whether the given point inside the bounding box of the element
  , inside: function(x, y) {
      var box = this.bbox()

      return x > box.x
          && y > box.y
          && x < box.x + box.width
          && y < box.y + box.height
    }
    // Show element
  , show: function() {
      return this.style('display', '')
    }
    // Hide element
  , hide: function() {
      return this.style('display', 'none')
    }
    // Is element visible?
  , visible: function() {
      return this.style('display') != 'none'
    }
    // Return id on string conversion
  , toString: function() {
      return this.attr('id')
    }
    // Return array of classes on the node
  , classes: function() {
      var attr = this.attr('class')

      return attr == null ? [] : attr.trim().split(SVG.regex.delimiter)
    }
    // Return true if class exists on the node, false otherwise
  , hasClass: function(name) {
      return this.classes().indexOf(name) != -1
    }
    // Add class to the node
  , addClass: function(name) {
      if (!this.hasClass(name)) {
        var array = this.classes()
        array.push(name)
        this.attr('class', array.join(' '))
      }

      return this
    }
    // Remove class from the node
  , removeClass: function(name) {
      if (this.hasClass(name)) {
        this.attr('class', this.classes().filter(function(c) {
          return c != name
        }).join(' '))
      }

      return this
    }
    // Toggle the presence of a class on the node
  , toggleClass: function(name) {
      return this.hasClass(name) ? this.removeClass(name) : this.addClass(name)
    }
    // Get referenced element form attribute value
  , reference: function(attr) {
      return SVG.get(this.attr(attr))
    }
    // Returns the parent element instance
  , parent: function(type) {
      var parent = this

      // check for parent
      if(!parent.node.parentNode) return null

      // get parent element
      parent = SVG.adopt(parent.node.parentNode)

      if(!type) return parent

      // loop trough ancestors if type is given
      while(parent && parent.node instanceof window.SVGElement){
        if(typeof type === 'string' ? parent.matches(type) : parent instanceof type) return parent
        if(!parent.node.parentNode || parent.node.parentNode.nodeName == '#document' || parent.node.parentNode.nodeName == '#document-fragment') return null // #759, #720
        parent = SVG.adopt(parent.node.parentNode)
      }
    }
    // Get parent document
  , doc: function() {
      return this instanceof SVG.Doc ? this : this.parent(SVG.Doc)
    }
    // return array of all ancestors of given type up to the root svg
  , parents: function(type) {
      var parents = [], parent = this

      do{
        parent = parent.parent(type)
        if(!parent || !parent.node) break

        parents.push(parent)
      } while(parent.parent)

      return parents
    }
    // matches the element vs a css selector
  , matches: function(selector){
      return matches(this.node, selector)
    }
    // Returns the svg node to call native svg methods on it
  , native: function() {
      return this.node
    }
    // Import raw svg
  , svg: function(svg) {
      // create temporary holder
      var well = document.createElement('svg')

      // act as a setter if svg is given
      if (svg && this instanceof SVG.Parent) {
        // dump raw svg
        well.innerHTML = '<svg>' + svg.replace(/\n/, '').replace(/<([\w:-]+)([^<]+?)\/>/g, '<$1$2></$1>') + '</svg>'

        // transplant nodes
        for (var i = 0, il = well.firstChild.childNodes.length; i < il; i++)
          this.node.appendChild(well.firstChild.firstChild)

      // otherwise act as a getter
      } else {
        // create a wrapping svg element in case of partial content
        well.appendChild(svg = document.createElement('svg'))

        // write svgjs data to the dom
        this.writeDataToDom()

        // insert a copy of this node
        svg.appendChild(this.node.cloneNode(true))

        // return target element
        return well.innerHTML.replace(/^<svg>/, '').replace(/<\/svg>$/, '')
      }

      return this
    }
  // write svgjs data to the dom
  , writeDataToDom: function() {

      // dump variables recursively
      if(this.each || this.lines){
        var fn = this.each ? this : this.lines();
        fn.each(function(){
          this.writeDataToDom()
        })
      }

      // remove previously set data
      this.node.removeAttribute('svgjs:data')

      if(Object.keys(this.dom).length)
        this.node.setAttribute('svgjs:data', JSON.stringify(this.dom)) // see #428

      return this
    }
  // set given data to the elements data property
  , setData: function(o){
      this.dom = o
      return this
    }
  , is: function(obj){
      return is(this, obj)
    }
  }
})

SVG.easing = {
  '-': function(pos){return pos}
, '<>':function(pos){return -Math.cos(pos * Math.PI) / 2 + 0.5}
, '>': function(pos){return  Math.sin(pos * Math.PI / 2)}
, '<': function(pos){return -Math.cos(pos * Math.PI / 2) + 1}
}

SVG.morph = function(pos){
  return function(from, to) {
    return new SVG.MorphObj(from, to).at(pos)
  }
}

SVG.Situation = SVG.invent({

  create: function(o){
    this.init = false
    this.reversed = false
    this.reversing = false

    this.duration = new SVG.Number(o.duration).valueOf()
    this.delay = new SVG.Number(o.delay).valueOf()

    this.start = +new Date() + this.delay
    this.finish = this.start + this.duration
    this.ease = o.ease

    // this.loop is incremented from 0 to this.loops
    // it is also incremented when in an infinite loop (when this.loops is true)
    this.loop = 0
    this.loops = false

    this.animations = {
      // functionToCall: [list of morphable objects]
      // e.g. move: [SVG.Number, SVG.Number]
    }

    this.attrs = {
      // holds all attributes which are not represented from a function svg.js provides
      // e.g. someAttr: SVG.Number
    }

    this.styles = {
      // holds all styles which should be animated
      // e.g. fill-color: SVG.Color
    }

    this.transforms = [
      // holds all transformations as transformation objects
      // e.g. [SVG.Rotate, SVG.Translate, SVG.Matrix]
    ]

    this.once = {
      // functions to fire at a specific position
      // e.g. "0.5": function foo(){}
    }

  }

})


SVG.FX = SVG.invent({

  create: function(element) {
    this._target = element
    this.situations = []
    this.active = false
    this.situation = null
    this.paused = false
    this.lastPos = 0
    this.pos = 0
    // The absolute position of an animation is its position in the context of its complete duration (including delay and loops)
    // When performing a delay, absPos is below 0 and when performing a loop, its value is above 1
    this.absPos = 0
    this._speed = 1
  }

, extend: {

    /**
     * sets or returns the target of this animation
     * @param o object || number In case of Object it holds all parameters. In case of number its the duration of the animation
     * @param ease function || string Function which should be used for easing or easing keyword
     * @param delay Number indicating the delay before the animation starts
     * @return target || this
     */
    animate: function(o, ease, delay){

      if(typeof o == 'object'){
        ease = o.ease
        delay = o.delay
        o = o.duration
      }

      var situation = new SVG.Situation({
        duration: o || 1000,
        delay: delay || 0,
        ease: SVG.easing[ease || '-'] || ease
      })

      this.queue(situation)

      return this
    }

    /**
     * sets a delay before the next element of the queue is called
     * @param delay Duration of delay in milliseconds
     * @return this.target()
     */
  , delay: function(delay){
      // The delay is performed by an empty situation with its duration
      // attribute set to the duration of the delay
      var situation = new SVG.Situation({
        duration: delay,
        delay: 0,
        ease: SVG.easing['-']
      })

      return this.queue(situation)
    }

    /**
     * sets or returns the target of this animation
     * @param null || target SVG.Element which should be set as new target
     * @return target || this
     */
  , target: function(target){
      if(target && target instanceof SVG.Element){
        this._target = target
        return this
      }

      return this._target
    }

    // returns the absolute position at a given time
  , timeToAbsPos: function(timestamp){
      return (timestamp - this.situation.start) / (this.situation.duration/this._speed)
    }

    // returns the timestamp from a given absolute positon
  , absPosToTime: function(absPos){
      return this.situation.duration/this._speed * absPos + this.situation.start
    }

    // starts the animationloop
  , startAnimFrame: function(){
      this.stopAnimFrame()
      this.animationFrame = window.requestAnimationFrame(function(){ this.step() }.bind(this))
    }

    // cancels the animationframe
  , stopAnimFrame: function(){
      window.cancelAnimationFrame(this.animationFrame)
    }

    // kicks off the animation - only does something when the queue is currently not active and at least one situation is set
  , start: function(){
      // dont start if already started
      if(!this.active && this.situation){
        this.active = true
        this.startCurrent()
      }

      return this
    }

    // start the current situation
  , startCurrent: function(){
      this.situation.start = +new Date + this.situation.delay/this._speed
      this.situation.finish = this.situation.start + this.situation.duration/this._speed
      return this.initAnimations().step()
    }

    /**
     * adds a function / Situation to the animation queue
     * @param fn function / situation to add
     * @return this
     */
  , queue: function(fn){
      if(typeof fn == 'function' || fn instanceof SVG.Situation)
        this.situations.push(fn)

      if(!this.situation) this.situation = this.situations.shift()

      return this
    }

    /**
     * pulls next element from the queue and execute it
     * @return this
     */
  , dequeue: function(){
      // stop current animation
      this.stop()

      // get next animation from queue
      this.situation = this.situations.shift()

      if(this.situation){
        if(this.situation instanceof SVG.Situation) {
          this.start()
        } else {
          // If it is not a SVG.Situation, then it is a function, we execute it
          this.situation.call(this)
        }
      }

      return this
    }

    // updates all animations to the current state of the element
    // this is important when one property could be changed from another property
  , initAnimations: function() {
      var i, j, source
      var s = this.situation

      if(s.init) return this

      for(i in s.animations){
        source = this.target()[i]()

        if(!Array.isArray(source)) {
          source = [source]
        }

        if(!Array.isArray(s.animations[i])) {
          s.animations[i] = [s.animations[i]]
        }

        //if(s.animations[i].length > source.length) {
        //  source.concat = source.concat(s.animations[i].slice(source.length, s.animations[i].length))
        //}

        for(j = source.length; j--;) {
          // The condition is because some methods return a normal number instead
          // of a SVG.Number
          if(s.animations[i][j] instanceof SVG.Number)
            source[j] = new SVG.Number(source[j])

          s.animations[i][j] = source[j].morph(s.animations[i][j])
        }
      }

      for(i in s.attrs){
        s.attrs[i] = new SVG.MorphObj(this.target().attr(i), s.attrs[i])
      }

      for(i in s.styles){
        s.styles[i] = new SVG.MorphObj(this.target().style(i), s.styles[i])
      }

      s.initialTransformation = this.target().matrixify()

      s.init = true
      return this
    }
  , clearQueue: function(){
      this.situations = []
      return this
    }
  , clearCurrent: function(){
      this.situation = null
      return this
    }
    /** stops the animation immediately
     * @param jumpToEnd A Boolean indicating whether to complete the current animation immediately.
     * @param clearQueue A Boolean indicating whether to remove queued animation as well.
     * @return this
     */
  , stop: function(jumpToEnd, clearQueue){
      var active = this.active
      this.active = false

      if(clearQueue){
        this.clearQueue()
      }

      if(jumpToEnd && this.situation){
        // initialize the situation if it was not
        !active && this.startCurrent()
        this.atEnd()
      }

      this.stopAnimFrame()

      return this.clearCurrent()
    }

    /** resets the element to the state where the current element has started
     * @return this
     */
  , reset: function(){
      if(this.situation){
        var temp = this.situation
        this.stop()
        this.situation = temp
        this.atStart()
      }
      return this
    }

    // Stop the currently-running animation, remove all queued animations, and complete all animations for the element.
  , finish: function(){

      this.stop(true, false)

      while(this.dequeue().situation && this.stop(true, false));

      this.clearQueue().clearCurrent()

      return this
    }

    // set the internal animation pointer at the start position, before any loops, and updates the visualisation
  , atStart: function() {
      return this.at(0, true)
    }

    // set the internal animation pointer at the end position, after all the loops, and updates the visualisation
  , atEnd: function() {
      if (this.situation.loops === true) {
        // If in a infinite loop, we end the current iteration
        this.situation.loops = this.situation.loop + 1
      }

      if(typeof this.situation.loops == 'number') {
        // If performing a finite number of loops, we go after all the loops
        return this.at(this.situation.loops, true)
      } else {
        // If no loops, we just go at the end
        return this.at(1, true)
      }
    }

    // set the internal animation pointer to the specified position and updates the visualisation
    // if isAbsPos is true, pos is treated as an absolute position
  , at: function(pos, isAbsPos){
      var durDivSpd = this.situation.duration/this._speed

      this.absPos = pos
      // If pos is not an absolute position, we convert it into one
      if (!isAbsPos) {
        if (this.situation.reversed) this.absPos = 1 - this.absPos
        this.absPos += this.situation.loop
      }

      this.situation.start = +new Date - this.absPos * durDivSpd
      this.situation.finish = this.situation.start + durDivSpd

      return this.step(true)
    }

    /**
     * sets or returns the speed of the animations
     * @param speed null || Number The new speed of the animations
     * @return Number || this
     */
  , speed: function(speed){
      if (speed === 0) return this.pause()

      if (speed) {
        this._speed = speed
        // We use an absolute position here so that speed can affect the delay before the animation
        return this.at(this.absPos, true)
      } else return this._speed
    }

    // Make loopable
  , loop: function(times, reverse) {
      var c = this.last()

      // store total loops
      c.loops = (times != null) ? times : true
      c.loop = 0

      if(reverse) c.reversing = true
      return this
    }

    // pauses the animation
  , pause: function(){
      this.paused = true
      this.stopAnimFrame()

      return this
    }

    // unpause the animation
  , play: function(){
      if(!this.paused) return this
      this.paused = false
      // We use an absolute position here so that the delay before the animation can be paused
      return this.at(this.absPos, true)
    }

    /**
     * toggle or set the direction of the animation
     * true sets direction to backwards while false sets it to forwards
     * @param reversed Boolean indicating whether to reverse the animation or not (default: toggle the reverse status)
     * @return this
     */
  , reverse: function(reversed){
      var c = this.last()

      if(typeof reversed == 'undefined') c.reversed = !c.reversed
      else c.reversed = reversed

      return this
    }


    /**
     * returns a float from 0-1 indicating the progress of the current animation
     * @param eased Boolean indicating whether the returned position should be eased or not
     * @return number
     */
  , progress: function(easeIt){
      return easeIt ? this.situation.ease(this.pos) : this.pos
    }

    /**
     * adds a callback function which is called when the current animation is finished
     * @param fn Function which should be executed as callback
     * @return number
     */
  , after: function(fn){
      var c = this.last()
        , wrapper = function wrapper(e){
            if(e.detail.situation == c){
              fn.call(this, c)
              this.off('finished.fx', wrapper) // prevent memory leak
            }
          }

      this.target().on('finished.fx', wrapper)

      return this._callStart()
    }

    // adds a callback which is called whenever one animation step is performed
  , during: function(fn){
      var c = this.last()
        , wrapper = function(e){
            if(e.detail.situation == c){
              fn.call(this, e.detail.pos, SVG.morph(e.detail.pos), e.detail.eased, c)
            }
          }

      // see above
      this.target().off('during.fx', wrapper).on('during.fx', wrapper)

      this.after(function(){
        this.off('during.fx', wrapper)
      })

      return this._callStart()
    }

    // calls after ALL animations in the queue are finished
  , afterAll: function(fn){
      var wrapper = function wrapper(e){
            fn.call(this)
            this.off('allfinished.fx', wrapper)
          }

      // see above
      this.target().off('allfinished.fx', wrapper).on('allfinished.fx', wrapper)

      return this._callStart()
    }

    // calls on every animation step for all animations
  , duringAll: function(fn){
      var wrapper = function(e){
            fn.call(this, e.detail.pos, SVG.morph(e.detail.pos), e.detail.eased, e.detail.situation)
          }

      this.target().off('during.fx', wrapper).on('during.fx', wrapper)

      this.afterAll(function(){
        this.off('during.fx', wrapper)
      })

      return this._callStart()
    }

  , last: function(){
      return this.situations.length ? this.situations[this.situations.length-1] : this.situation
    }

    // adds one property to the animations
  , add: function(method, args, type){
      this.last()[type || 'animations'][method] = args
      return this._callStart()
    }

    /** perform one step of the animation
     *  @param ignoreTime Boolean indicating whether to ignore time and use position directly or recalculate position based on time
     *  @return this
     */
  , step: function(ignoreTime){

      // convert current time to an absolute position
      if(!ignoreTime) this.absPos = this.timeToAbsPos(+new Date)

      // This part convert an absolute position to a position
      if(this.situation.loops !== false) {
        var absPos, absPosInt, lastLoop

        // If the absolute position is below 0, we just treat it as if it was 0
        absPos = Math.max(this.absPos, 0)
        absPosInt = Math.floor(absPos)

        if(this.situation.loops === true || absPosInt < this.situation.loops) {
          this.pos = absPos - absPosInt
          lastLoop = this.situation.loop
          this.situation.loop = absPosInt
        } else {
          this.absPos = this.situation.loops
          this.pos = 1
          // The -1 here is because we don't want to toggle reversed when all the loops have been completed
          lastLoop = this.situation.loop - 1
          this.situation.loop = this.situation.loops
        }

        if(this.situation.reversing) {
          // Toggle reversed if an odd number of loops as occured since the last call of step
          this.situation.reversed = this.situation.reversed != Boolean((this.situation.loop - lastLoop) % 2)
        }

      } else {
        // If there are no loop, the absolute position must not be above 1
        this.absPos = Math.min(this.absPos, 1)
        this.pos = this.absPos
      }

      // while the absolute position can be below 0, the position must not be below 0
      if(this.pos < 0) this.pos = 0

      if(this.situation.reversed) this.pos = 1 - this.pos


      // apply easing
      var eased = this.situation.ease(this.pos)

      // call once-callbacks
      for(var i in this.situation.once){
        if(i > this.lastPos && i <= eased){
          this.situation.once[i].call(this.target(), this.pos, eased)
          delete this.situation.once[i]
        }
      }

      // fire during callback with position, eased position and current situation as parameter
      if(this.active) this.target().fire('during', {pos: this.pos, eased: eased, fx: this, situation: this.situation})

      // the user may call stop or finish in the during callback
      // so make sure that we still have a valid situation
      if(!this.situation){
        return this
      }

      // apply the actual animation to every property
      this.eachAt()

      // do final code when situation is finished
      if((this.pos == 1 && !this.situation.reversed) || (this.situation.reversed && this.pos == 0)){

        // stop animation callback
        this.stopAnimFrame()

        // fire finished callback with current situation as parameter
        this.target().fire('finished', {fx:this, situation: this.situation})

        if(!this.situations.length){
          this.target().fire('allfinished')

          // Recheck the length since the user may call animate in the afterAll callback
          if(!this.situations.length){
            this.target().off('.fx') // there shouldnt be any binding left, but to make sure...
            this.active = false
          }
        }

        // start next animation
        if(this.active) this.dequeue()
        else this.clearCurrent()

      }else if(!this.paused && this.active){
        // we continue animating when we are not at the end
        this.startAnimFrame()
      }

      // save last eased position for once callback triggering
      this.lastPos = eased
      return this

    }

    // calculates the step for every property and calls block with it
  , eachAt: function(){
      var i, len, at, self = this, target = this.target(), s = this.situation

      // apply animations which can be called trough a method
      for(i in s.animations){

        at = [].concat(s.animations[i]).map(function(el){
          return typeof el !== 'string' && el.at ? el.at(s.ease(self.pos), self.pos) : el
        })

        target[i].apply(target, at)

      }

      // apply animation which has to be applied with attr()
      for(i in s.attrs){

        at = [i].concat(s.attrs[i]).map(function(el){
          return typeof el !== 'string' && el.at ? el.at(s.ease(self.pos), self.pos) : el
        })

        target.attr.apply(target, at)

      }

      // apply animation which has to be applied with style()
      for(i in s.styles){

        at = [i].concat(s.styles[i]).map(function(el){
          return typeof el !== 'string' && el.at ? el.at(s.ease(self.pos), self.pos) : el
        })

        target.style.apply(target, at)

      }

      // animate initialTransformation which has to be chained
      if(s.transforms.length){

        // get initial initialTransformation
        at = s.initialTransformation
        for(i = 0, len = s.transforms.length; i < len; i++){

          // get next transformation in chain
          var a = s.transforms[i]

          // multiply matrix directly
          if(a instanceof SVG.Matrix){

            if(a.relative){
              at = at.multiply(new SVG.Matrix().morph(a).at(s.ease(this.pos)))
            }else{
              at = at.morph(a).at(s.ease(this.pos))
            }
            continue
          }

          // when transformation is absolute we have to reset the needed transformation first
          if(!a.relative)
            a.undo(at.extract())

          // and reapply it after
          at = at.multiply(a.at(s.ease(this.pos)))

        }

        // set new matrix on element
        target.matrix(at)
      }

      return this

    }


    // adds an once-callback which is called at a specific position and never again
  , once: function(pos, fn, isEased){
      var c = this.last()
      if(!isEased) pos = c.ease(pos)

      c.once[pos] = fn

      return this
    }

  , _callStart: function() {
      setTimeout(function(){this.start()}.bind(this), 0)
      return this
    }

  }

, parent: SVG.Element

  // Add method to parent elements
, construct: {
    // Get fx module or create a new one, then animate with given duration and ease
    animate: function(o, ease, delay) {
      return (this.fx || (this.fx = new SVG.FX(this))).animate(o, ease, delay)
    }
  , delay: function(delay){
      return (this.fx || (this.fx = new SVG.FX(this))).delay(delay)
    }
  , stop: function(jumpToEnd, clearQueue) {
      if (this.fx)
        this.fx.stop(jumpToEnd, clearQueue)

      return this
    }
  , finish: function() {
      if (this.fx)
        this.fx.finish()

      return this
    }
    // Pause current animation
  , pause: function() {
      if (this.fx)
        this.fx.pause()

      return this
    }
    // Play paused current animation
  , play: function() {
      if (this.fx)
        this.fx.play()

      return this
    }
    // Set/Get the speed of the animations
  , speed: function(speed) {
      if (this.fx)
        if (speed == null)
          return this.fx.speed()
        else
          this.fx.speed(speed)

      return this
    }
  }

})

// MorphObj is used whenever no morphable object is given
SVG.MorphObj = SVG.invent({

  create: function(from, to){
    // prepare color for morphing
    if(SVG.Color.isColor(to)) return new SVG.Color(from).morph(to)
    // check if we have a list of values
    if(SVG.regex.delimiter.test(from)) {
      // prepare path for morphing
      if(SVG.regex.pathLetters.test(from)) return new SVG.PathArray(from).morph(to)
      // prepare value list for morphing
      else return new SVG.Array(from).morph(to)
    }
    // prepare number for morphing
    if(SVG.regex.numberAndUnit.test(to)) return new SVG.Number(from).morph(to)

    // prepare for plain morphing
    this.value = from
    this.destination = to
  }

, extend: {
    at: function(pos, real){
      return real < 1 ? this.value : this.destination
    },

    valueOf: function(){
      return this.value
    }
  }

})

SVG.extend(SVG.FX, {
  // Add animatable attributes
  attr: function(a, v, relative) {
    // apply attributes individually
    if (typeof a == 'object') {
      for (var key in a)
        this.attr(key, a[key])

    } else {
      this.add(a, v, 'attrs')
    }

    return this
  }
  // Add animatable styles
, style: function(s, v) {
    if (typeof s == 'object')
      for (var key in s)
        this.style(key, s[key])

    else
      this.add(s, v, 'styles')

    return this
  }
  // Animatable x-axis
, x: function(x, relative) {
    if(this.target() instanceof SVG.G){
      this.transform({x:x}, relative)
      return this
    }

    var num = new SVG.Number(x)
    num.relative = relative
    return this.add('x', num)
  }
  // Animatable y-axis
, y: function(y, relative) {
    if(this.target() instanceof SVG.G){
      this.transform({y:y}, relative)
      return this
    }

    var num = new SVG.Number(y)
    num.relative = relative
    return this.add('y', num)
  }
  // Animatable center x-axis
, cx: function(x) {
    return this.add('cx', new SVG.Number(x))
  }
  // Animatable center y-axis
, cy: function(y) {
    return this.add('cy', new SVG.Number(y))
  }
  // Add animatable move
, move: function(x, y) {
    return this.x(x).y(y)
  }
  // Add animatable center
, center: function(x, y) {
    return this.cx(x).cy(y)
  }
  // Add animatable size
, size: function(width, height) {
    if (this.target() instanceof SVG.Text) {
      // animate font size for Text elements
      this.attr('font-size', width)

    } else {
      // animate bbox based size for all other elements
      var box

      if(!width || !height){
        box = this.target().bbox()
      }

      if(!width){
        width = box.width / box.height  * height
      }

      if(!height){
        height = box.height / box.width  * width
      }

      this.add('width' , new SVG.Number(width))
          .add('height', new SVG.Number(height))

    }

    return this
  }
  // Add animatable width
, width: function(width) {
    return this.add('width', new SVG.Number(width))
  }
  // Add animatable height
, height: function(height) {
    return this.add('height', new SVG.Number(height))
  }
  // Add animatable plot
, plot: function(a, b, c, d) {
    // Lines can be plotted with 4 arguments
    if(arguments.length == 4) {
      return this.plot([a, b, c, d])
    }

    return this.add('plot', new (this.target().morphArray)(a))
  }
  // Add leading method
, leading: function(value) {
    return this.target().leading ?
      this.add('leading', new SVG.Number(value)) :
      this
  }
  // Add animatable viewbox
, viewbox: function(x, y, width, height) {
    if (this.target() instanceof SVG.Container) {
      this.add('viewbox', new SVG.ViewBox(x, y, width, height))
    }

    return this
  }
, update: function(o) {
    if (this.target() instanceof SVG.Stop) {
      if (typeof o == 'number' || o instanceof SVG.Number) {
        return this.update({
          offset:  arguments[0]
        , color:   arguments[1]
        , opacity: arguments[2]
        })
      }

      if (o.opacity != null) this.attr('stop-opacity', o.opacity)
      if (o.color   != null) this.attr('stop-color', o.color)
      if (o.offset  != null) this.attr('offset', o.offset)
    }

    return this
  }
})

SVG.Box = SVG.invent({
  create: function(x, y, width, height) {
    if (typeof x == 'object' && !(x instanceof SVG.Element)) {
      // chromes getBoundingClientRect has no x and y property
      return SVG.Box.call(this, x.left != null ? x.left : x.x , x.top != null ? x.top : x.y, x.width, x.height)
    } else if (arguments.length == 4) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
    }

    // add center, right, bottom...
    fullBox(this)
  }
, extend: {
    // Merge rect box with another, return a new instance
    merge: function(box) {
      var b = new this.constructor()

      // merge boxes
      b.x      = Math.min(this.x, box.x)
      b.y      = Math.min(this.y, box.y)
      b.width  = Math.max(this.x + this.width,  box.x + box.width)  - b.x
      b.height = Math.max(this.y + this.height, box.y + box.height) - b.y

      return fullBox(b)
    }

  , transform: function(m) {
      var xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, p, bbox

      var pts = [
        new SVG.Point(this.x, this.y),
        new SVG.Point(this.x2, this.y),
        new SVG.Point(this.x, this.y2),
        new SVG.Point(this.x2, this.y2)
      ]

      pts.forEach(function(p) {
        p = p.transform(m)
        xMin = Math.min(xMin,p.x)
        xMax = Math.max(xMax,p.x)
        yMin = Math.min(yMin,p.y)
        yMax = Math.max(yMax,p.y)
      })

      bbox = new this.constructor()
      bbox.x = xMin
      bbox.width = xMax-xMin
      bbox.y = yMin
      bbox.height = yMax-yMin

      fullBox(bbox)

      return bbox
    }
  }
})

SVG.BBox = SVG.invent({
  // Initialize
  create: function(element) {
    SVG.Box.apply(this, [].slice.call(arguments))

    // get values if element is given
    if (element instanceof SVG.Element) {
      var box

      // yes this is ugly, but Firefox can be a pain when it comes to elements that are not yet rendered
      try {

        if (!document.documentElement.contains){
          // This is IE - it does not support contains() for top-level SVGs
          var topParent = element.node
          while (topParent.parentNode){
            topParent = topParent.parentNode
          }
          if (topParent != document) throw new Exception('Element not in the dom')
        } else {
          // the element is NOT in the dom, throw error
          if(!document.documentElement.contains(element.node)) throw new Exception('Element not in the dom')
        }

        // find native bbox
        box = element.node.getBBox()
      } catch(e) {
        if(element instanceof SVG.Shape){
          var clone = element.clone(SVG.parser.draw.instance).show()
          box = clone.node.getBBox()
          clone.remove()
        }else{
          box = {
            x:      element.node.clientLeft
          , y:      element.node.clientTop
          , width:  element.node.clientWidth
          , height: element.node.clientHeight
          }
        }
      }

      SVG.Box.call(this, box)
    }

  }

  // Define ancestor
, inherit: SVG.Box

  // Define Parent
, parent: SVG.Element

  // Constructor
, construct: {
    // Get bounding box
    bbox: function() {
      return new SVG.BBox(this)
    }
  }

})

SVG.BBox.prototype.constructor = SVG.BBox


SVG.extend(SVG.Element, {
  tbox: function(){
    console.warn('Use of TBox is deprecated and mapped to RBox. Use .rbox() instead.')
    return this.rbox(this.doc())
  }
})

SVG.RBox = SVG.invent({
  // Initialize
  create: function(element) {
    SVG.Box.apply(this, [].slice.call(arguments))

    if (element instanceof SVG.Element) {
      SVG.Box.call(this, element.node.getBoundingClientRect())
    }
  }

, inherit: SVG.Box

  // define Parent
, parent: SVG.Element

, extend: {
    addOffset: function() {
      // offset by window scroll position, because getBoundingClientRect changes when window is scrolled
      this.x += window.pageXOffset
      this.y += window.pageYOffset
      return this
    }
  }

  // Constructor
, construct: {
    // Get rect box
    rbox: function(el) {
      if (el) return new SVG.RBox(this).transform(el.screenCTM().inverse())
      return new SVG.RBox(this).addOffset()
    }
  }

})

SVG.RBox.prototype.constructor = SVG.RBox

SVG.Matrix = SVG.invent({
  // Initialize
  create: function(source) {
    var i, base = arrayToMatrix([1, 0, 0, 1, 0, 0])

    // ensure source as object
    source = source instanceof SVG.Element ?
      source.matrixify() :
    typeof source === 'string' ?
      arrayToMatrix(source.split(SVG.regex.delimiter).map(parseFloat)) :
    arguments.length == 6 ?
      arrayToMatrix([].slice.call(arguments)) :
    Array.isArray(source) ?
      arrayToMatrix(source) :
    typeof source === 'object' ?
      source : base

    // merge source
    for (i = abcdef.length - 1; i >= 0; --i)
      this[abcdef[i]] = source[abcdef[i]] != null ?
        source[abcdef[i]] : base[abcdef[i]]
  }

  // Add methods
, extend: {
    // Extract individual transformations
    extract: function() {
      // find delta transform points
      var px    = deltaTransformPoint(this, 0, 1)
        , py    = deltaTransformPoint(this, 1, 0)
        , skewX = 180 / Math.PI * Math.atan2(px.y, px.x) - 90

      return {
        // translation
        x:        this.e
      , y:        this.f
      , transformedX:(this.e * Math.cos(skewX * Math.PI / 180) + this.f * Math.sin(skewX * Math.PI / 180)) / Math.sqrt(this.a * this.a + this.b * this.b)
      , transformedY:(this.f * Math.cos(skewX * Math.PI / 180) + this.e * Math.sin(-skewX * Math.PI / 180)) / Math.sqrt(this.c * this.c + this.d * this.d)
        // skew
      , skewX:    -skewX
      , skewY:    180 / Math.PI * Math.atan2(py.y, py.x)
        // scale
      , scaleX:   Math.sqrt(this.a * this.a + this.b * this.b)
      , scaleY:   Math.sqrt(this.c * this.c + this.d * this.d)
        // rotation
      , rotation: skewX
      , a: this.a
      , b: this.b
      , c: this.c
      , d: this.d
      , e: this.e
      , f: this.f
      , matrix: new SVG.Matrix(this)
      }
    }
    // Clone matrix
  , clone: function() {
      return new SVG.Matrix(this)
    }
    // Morph one matrix into another
  , morph: function(matrix) {
      // store new destination
      this.destination = new SVG.Matrix(matrix)

      return this
    }
    // Get morphed matrix at a given position
  , at: function(pos) {
      // make sure a destination is defined
      if (!this.destination) return this

      // calculate morphed matrix at a given position
      var matrix = new SVG.Matrix({
        a: this.a + (this.destination.a - this.a) * pos
      , b: this.b + (this.destination.b - this.b) * pos
      , c: this.c + (this.destination.c - this.c) * pos
      , d: this.d + (this.destination.d - this.d) * pos
      , e: this.e + (this.destination.e - this.e) * pos
      , f: this.f + (this.destination.f - this.f) * pos
      })

      return matrix
    }
    // Multiplies by given matrix
  , multiply: function(matrix) {
      return new SVG.Matrix(this.native().multiply(parseMatrix(matrix).native()))
    }
    // Inverses matrix
  , inverse: function() {
      return new SVG.Matrix(this.native().inverse())
    }
    // Translate matrix
  , translate: function(x, y) {
      return new SVG.Matrix(this.native().translate(x || 0, y || 0))
    }
    // Scale matrix
  , scale: function(x, y, cx, cy) {
      // support uniformal scale
      if (arguments.length == 1) {
        y = x
      } else if (arguments.length == 3) {
        cy = cx
        cx = y
        y = x
      }

      return this.around(cx, cy, new SVG.Matrix(x, 0, 0, y, 0, 0))
    }
    // Rotate matrix
  , rotate: function(r, cx, cy) {
      // convert degrees to radians
      r = SVG.utils.radians(r)

      return this.around(cx, cy, new SVG.Matrix(Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0))
    }
    // Flip matrix on x or y, at a given offset
  , flip: function(a, o) {
      return a == 'x' ?
          this.scale(-1, 1, o, 0) :
        a == 'y' ?
          this.scale(1, -1, 0, o) :
          this.scale(-1, -1, a, o != null ? o : a)
    }
    // Skew
  , skew: function(x, y, cx, cy) {
      // support uniformal skew
      if (arguments.length == 1) {
        y = x
      } else if (arguments.length == 3) {
        cy = cx
        cx = y
        y = x
      }

      // convert degrees to radians
      x = SVG.utils.radians(x)
      y = SVG.utils.radians(y)

      return this.around(cx, cy, new SVG.Matrix(1, Math.tan(y), Math.tan(x), 1, 0, 0))
    }
    // SkewX
  , skewX: function(x, cx, cy) {
      return this.skew(x, 0, cx, cy)
    }
    // SkewY
  , skewY: function(y, cx, cy) {
      return this.skew(0, y, cx, cy)
    }
    // Transform around a center point
  , around: function(cx, cy, matrix) {
      return this
        .multiply(new SVG.Matrix(1, 0, 0, 1, cx || 0, cy || 0))
        .multiply(matrix)
        .multiply(new SVG.Matrix(1, 0, 0, 1, -cx || 0, -cy || 0))
    }
    // Convert to native SVGMatrix
  , native: function() {
      // create new matrix
      var matrix = SVG.parser.native.createSVGMatrix()

      // update with current values
      for (var i = abcdef.length - 1; i >= 0; i--)
        matrix[abcdef[i]] = this[abcdef[i]]

      return matrix
    }
    // Convert matrix to string
  , toString: function() {
      // Construct the matrix directly, avoid values that are too small
      return 'matrix(' + float32String(this.a) + ',' + float32String(this.b)
        + ',' + float32String(this.c) + ',' + float32String(this.d)
        + ',' + float32String(this.e) + ',' + float32String(this.f)
        + ')'
    }
  }

  // Define parent
, parent: SVG.Element

  // Add parent method
, construct: {
    // Get current matrix
    ctm: function() {
      return new SVG.Matrix(this.node.getCTM())
    },
    // Get current screen matrix
    screenCTM: function() {
      /* https://bugzilla.mozilla.org/show_bug.cgi?id=1344537
         This is needed because FF does not return the transformation matrix
         for the inner coordinate system when getScreenCTM() is called on nested svgs.
         However all other Browsers do that */
      if(this instanceof SVG.Nested) {
        var rect = this.rect(1,1)
        var m = rect.node.getScreenCTM()
        rect.remove()
        return new SVG.Matrix(m)
      }
      return new SVG.Matrix(this.node.getScreenCTM())
    }

  }

})

SVG.Point = SVG.invent({
  // Initialize
  create: function(x,y) {
    var i, source, base = {x:0, y:0}

    // ensure source as object
    source = Array.isArray(x) ?
      {x:x[0], y:x[1]} :
    typeof x === 'object' ?
      {x:x.x, y:x.y} :
    x != null ?
      {x:x, y:(y != null ? y : x)} : base // If y has no value, then x is used has its value

    // merge source
    this.x = source.x
    this.y = source.y
  }

  // Add methods
, extend: {
    // Clone point
    clone: function() {
      return new SVG.Point(this)
    }
    // Morph one point into another
  , morph: function(x, y) {
      // store new destination
      this.destination = new SVG.Point(x, y)

      return this
    }
    // Get morphed point at a given position
  , at: function(pos) {
      // make sure a destination is defined
      if (!this.destination) return this

      // calculate morphed matrix at a given position
      var point = new SVG.Point({
        x: this.x + (this.destination.x - this.x) * pos
      , y: this.y + (this.destination.y - this.y) * pos
      })

      return point
    }
    // Convert to native SVGPoint
  , native: function() {
      // create new point
      var point = SVG.parser.native.createSVGPoint()

      // update with current values
      point.x = this.x
      point.y = this.y

      return point
    }
    // transform point with matrix
  , transform: function(matrix) {
      return new SVG.Point(this.native().matrixTransform(matrix.native()))
    }

  }

})

SVG.extend(SVG.Element, {

  // Get point
  point: function(x, y) {
    return new SVG.Point(x,y).transform(this.screenCTM().inverse());
  }

})

SVG.extend(SVG.Element, {
  // Set svg element attribute
  attr: function(a, v, n) {
    // act as full getter
    if (a == null) {
      // get an object of attributes
      a = {}
      v = this.node.attributes
      for (n = v.length - 1; n >= 0; n--)
        a[v[n].nodeName] = SVG.regex.isNumber.test(v[n].nodeValue) ? parseFloat(v[n].nodeValue) : v[n].nodeValue

      return a

    } else if (typeof a == 'object') {
      // apply every attribute individually if an object is passed
      for (v in a) this.attr(v, a[v])

    } else if (v === null) {
        // remove value
        this.node.removeAttribute(a)

    } else if (v == null) {
      // act as a getter if the first and only argument is not an object
      v = this.node.getAttribute(a)
      return v == null ?
        SVG.defaults.attrs[a] :
      SVG.regex.isNumber.test(v) ?
        parseFloat(v) : v

    } else {
      // BUG FIX: some browsers will render a stroke if a color is given even though stroke width is 0
      if (a == 'stroke-width')
        this.attr('stroke', parseFloat(v) > 0 ? this._stroke : null)
      else if (a == 'stroke')
        this._stroke = v

      // convert image fill and stroke to patterns
      if (a == 'fill' || a == 'stroke') {
        if (SVG.regex.isImage.test(v))
          v = this.doc().defs().image(v, 0, 0)

        if (v instanceof SVG.Image)
          v = this.doc().defs().pattern(0, 0, function() {
            this.add(v)
          })
      }

      // ensure correct numeric values (also accepts NaN and Infinity)
      if (typeof v === 'number')
        v = new SVG.Number(v)

      // ensure full hex color
      else if (SVG.Color.isColor(v))
        v = new SVG.Color(v)

      // parse array values
      else if (Array.isArray(v))
        v = new SVG.Array(v)

      // if the passed attribute is leading...
      if (a == 'leading') {
        // ... call the leading method instead
        if (this.leading)
          this.leading(v)
      } else {
        // set given attribute on node
        typeof n === 'string' ?
          this.node.setAttributeNS(n, a, v.toString()) :
          this.node.setAttribute(a, v.toString())
      }

      // rebuild if required
      if (this.rebuild && (a == 'font-size' || a == 'x'))
        this.rebuild(a, v)
    }

    return this
  }
})
SVG.extend(SVG.Element, {
  // Add transformations
  transform: function(o, relative) {
    // get target in case of the fx module, otherwise reference this
    var target = this
      , matrix, bbox

    // act as a getter
    if (typeof o !== 'object') {
      // get current matrix
      matrix = new SVG.Matrix(target).extract()

      return typeof o === 'string' ? matrix[o] : matrix
    }

    // get current matrix
    matrix = new SVG.Matrix(target)

    // ensure relative flag
    relative = !!relative || !!o.relative

    // act on matrix
    if (o.a != null) {
      matrix = relative ?
        // relative
        matrix.multiply(new SVG.Matrix(o)) :
        // absolute
        new SVG.Matrix(o)

    // act on rotation
    } else if (o.rotation != null) {
      // ensure centre point
      ensureCentre(o, target)

      // apply transformation
      matrix = relative ?
        // relative
        matrix.rotate(o.rotation, o.cx, o.cy) :
        // absolute
        matrix.rotate(o.rotation - matrix.extract().rotation, o.cx, o.cy)

    // act on scale
    } else if (o.scale != null || o.scaleX != null || o.scaleY != null) {
      // ensure centre point
      ensureCentre(o, target)

      // ensure scale values on both axes
      o.scaleX = o.scale != null ? o.scale : o.scaleX != null ? o.scaleX : 1
      o.scaleY = o.scale != null ? o.scale : o.scaleY != null ? o.scaleY : 1

      if (!relative) {
        // absolute; multiply inversed values
        var e = matrix.extract()
        o.scaleX = o.scaleX * 1 / e.scaleX
        o.scaleY = o.scaleY * 1 / e.scaleY
      }

      matrix = matrix.scale(o.scaleX, o.scaleY, o.cx, o.cy)

    // act on skew
    } else if (o.skew != null || o.skewX != null || o.skewY != null) {
      // ensure centre point
      ensureCentre(o, target)

      // ensure skew values on both axes
      o.skewX = o.skew != null ? o.skew : o.skewX != null ? o.skewX : 0
      o.skewY = o.skew != null ? o.skew : o.skewY != null ? o.skewY : 0

      if (!relative) {
        // absolute; reset skew values
        var e = matrix.extract()
        matrix = matrix.multiply(new SVG.Matrix().skew(e.skewX, e.skewY, o.cx, o.cy).inverse())
      }

      matrix = matrix.skew(o.skewX, o.skewY, o.cx, o.cy)

    // act on flip
    } else if (o.flip) {
      if(o.flip == 'x' || o.flip == 'y') {
        o.offset = o.offset == null ? target.bbox()['c' + o.flip] : o.offset
      } else {
        if(o.offset == null) {
          bbox = target.bbox()
          o.flip = bbox.cx
          o.offset = bbox.cy
        } else {
          o.flip = o.offset
        }
      }

      matrix = new SVG.Matrix().flip(o.flip, o.offset)

    // act on translate
    } else if (o.x != null || o.y != null) {
      if (relative) {
        // relative
        matrix = matrix.translate(o.x, o.y)
      } else {
        // absolute
        if (o.x != null) matrix.e = o.x
        if (o.y != null) matrix.f = o.y
      }
    }

    return this.attr('transform', matrix)
  }
})

SVG.extend(SVG.FX, {
  transform: function(o, relative) {
    // get target in case of the fx module, otherwise reference this
    var target = this.target()
      , matrix, bbox

    // act as a getter
    if (typeof o !== 'object') {
      // get current matrix
      matrix = new SVG.Matrix(target).extract()

      return typeof o === 'string' ? matrix[o] : matrix
    }

    // ensure relative flag
    relative = !!relative || !!o.relative

    // act on matrix
    if (o.a != null) {
      matrix = new SVG.Matrix(o)

    // act on rotation
    } else if (o.rotation != null) {
      // ensure centre point
      ensureCentre(o, target)

      // apply transformation
      matrix = new SVG.Rotate(o.rotation, o.cx, o.cy)

    // act on scale
    } else if (o.scale != null || o.scaleX != null || o.scaleY != null) {
      // ensure centre point
      ensureCentre(o, target)

      // ensure scale values on both axes
      o.scaleX = o.scale != null ? o.scale : o.scaleX != null ? o.scaleX : 1
      o.scaleY = o.scale != null ? o.scale : o.scaleY != null ? o.scaleY : 1

      matrix = new SVG.Scale(o.scaleX, o.scaleY, o.cx, o.cy)

    // act on skew
    } else if (o.skewX != null || o.skewY != null) {
      // ensure centre point
      ensureCentre(o, target)

      // ensure skew values on both axes
      o.skewX = o.skewX != null ? o.skewX : 0
      o.skewY = o.skewY != null ? o.skewY : 0

      matrix = new SVG.Skew(o.skewX, o.skewY, o.cx, o.cy)

    // act on flip
    } else if (o.flip) {
      if(o.flip == 'x' || o.flip == 'y') {
        o.offset = o.offset == null ? target.bbox()['c' + o.flip] : o.offset
      } else {
        if(o.offset == null) {
          bbox = target.bbox()
          o.flip = bbox.cx
          o.offset = bbox.cy
        } else {
          o.flip = o.offset
        }
      }

      matrix = new SVG.Matrix().flip(o.flip, o.offset)

    // act on translate
    } else if (o.x != null || o.y != null) {
      matrix = new SVG.Translate(o.x, o.y)
    }

    if(!matrix) return this

    matrix.relative = relative

    this.last().transforms.push(matrix)

    return this._callStart()
  }
})

SVG.extend(SVG.Element, {
  // Reset all transformations
  untransform: function() {
    return this.attr('transform', null)
  },
  // merge the whole transformation chain into one matrix and returns it
  matrixify: function() {

    var matrix = (this.attr('transform') || '')
      // split transformations
      .split(SVG.regex.transforms).slice(0,-1).map(function(str){
        // generate key => value pairs
        var kv = str.trim().split('(')
        return [kv[0], kv[1].split(SVG.regex.delimiter).map(function(str){ return parseFloat(str) })]
      })
      // merge every transformation into one matrix
      .reduce(function(matrix, transform){

        if(transform[0] == 'matrix') return matrix.multiply(arrayToMatrix(transform[1]))
        return matrix[transform[0]].apply(matrix, transform[1])

      }, new SVG.Matrix())

    return matrix
  },
  // add an element to another parent without changing the visual representation on the screen
  toParent: function(parent) {
    if(this == parent) return this
    var ctm = this.screenCTM()
    var pCtm = parent.screenCTM().inverse()

    this.addTo(parent).untransform().transform(pCtm.multiply(ctm))

    return this
  },
  // same as above with parent equals root-svg
  toDoc: function() {
    return this.toParent(this.doc())
  }

})

SVG.Transformation = SVG.invent({

  create: function(source, inversed){

    if(arguments.length > 1 && typeof inversed != 'boolean'){
      return this.constructor.call(this, [].slice.call(arguments))
    }

    if(Array.isArray(source)){
      for(var i = 0, len = this.arguments.length; i < len; ++i){
        this[this.arguments[i]] = source[i]
      }
    } else if(typeof source == 'object'){
      for(var i = 0, len = this.arguments.length; i < len; ++i){
        this[this.arguments[i]] = source[this.arguments[i]]
      }
    }

    this.inversed = false

    if(inversed === true){
      this.inversed = true
    }

  }

, extend: {

    arguments: []
  , method: ''

  , at: function(pos){

      var params = []

      for(var i = 0, len = this.arguments.length; i < len; ++i){
        params.push(this[this.arguments[i]])
      }

      var m = this._undo || new SVG.Matrix()

      m = new SVG.Matrix().morph(SVG.Matrix.prototype[this.method].apply(m, params)).at(pos)

      return this.inversed ? m.inverse() : m

    }

  , undo: function(o){
      for(var i = 0, len = this.arguments.length; i < len; ++i){
        o[this.arguments[i]] = typeof this[this.arguments[i]] == 'undefined' ? 0 : o[this.arguments[i]]
      }

      // The method SVG.Matrix.extract which was used before calling this
      // method to obtain a value for the parameter o doesn't return a cx and
      // a cy so we use the ones that were provided to this object at its creation
      o.cx = this.cx
      o.cy = this.cy

      this._undo = new SVG[capitalize(this.method)](o, true).at(1)

      return this
    }

  }

})

SVG.Translate = SVG.invent({

  parent: SVG.Matrix
, inherit: SVG.Transformation

, create: function(source, inversed){
    this.constructor.apply(this, [].slice.call(arguments))
  }

, extend: {
    arguments: ['transformedX', 'transformedY']
  , method: 'translate'
  }

})

SVG.Rotate = SVG.invent({

  parent: SVG.Matrix
, inherit: SVG.Transformation

, create: function(source, inversed){
    this.constructor.apply(this, [].slice.call(arguments))
  }

, extend: {
    arguments: ['rotation', 'cx', 'cy']
  , method: 'rotate'
  , at: function(pos){
      var m = new SVG.Matrix().rotate(new SVG.Number().morph(this.rotation - (this._undo ? this._undo.rotation : 0)).at(pos), this.cx, this.cy)
      return this.inversed ? m.inverse() : m
    }
  , undo: function(o){
      this._undo = o
      return this
    }
  }

})

SVG.Scale = SVG.invent({

  parent: SVG.Matrix
, inherit: SVG.Transformation

, create: function(source, inversed){
    this.constructor.apply(this, [].slice.call(arguments))
  }

, extend: {
    arguments: ['scaleX', 'scaleY', 'cx', 'cy']
  , method: 'scale'
  }

})

SVG.Skew = SVG.invent({

  parent: SVG.Matrix
, inherit: SVG.Transformation

, create: function(source, inversed){
    this.constructor.apply(this, [].slice.call(arguments))
  }

, extend: {
    arguments: ['skewX', 'skewY', 'cx', 'cy']
  , method: 'skew'
  }

})

SVG.extend(SVG.Element, {
  // Dynamic style generator
  style: function(s, v) {
    if (arguments.length == 0) {
      // get full style
      return this.node.style.cssText || ''

    } else if (arguments.length < 2) {
      // apply every style individually if an object is passed
      if (typeof s == 'object') {
        for (v in s) this.style(v, s[v])

      } else if (SVG.regex.isCss.test(s)) {
        // parse css string
        s = s.split(/\s*;\s*/)
          // filter out suffix ; and stuff like ;;
          .filter(function(e) { return !!e })
          .map(function(e){ return e.split(/\s*:\s*/) })

        // apply every definition individually
        while (v = s.pop()) {
          this.style(v[0], v[1])
        }
      } else {
        // act as a getter if the first and only argument is not an object
        return this.node.style[camelCase(s)]
      }

    } else {
      this.node.style[camelCase(s)] = v === null || SVG.regex.isBlank.test(v) ? '' : v
    }

    return this
  }
})
SVG.Parent = SVG.invent({
  // Initialize node
  create: function(element) {
    this.constructor.call(this, element)
  }

  // Inherit from
, inherit: SVG.Element

  // Add class methods
, extend: {
    // Returns all child elements
    children: function() {
      return SVG.utils.map(SVG.utils.filterSVGElements(this.node.childNodes), function(node) {
        return SVG.adopt(node)
      })
    }
    // Add given element at a position
  , add: function(element, i) {
      if (i == null)
        this.node.appendChild(element.node)
      else if (element.node != this.node.childNodes[i])
        this.node.insertBefore(element.node, this.node.childNodes[i])

      return this
    }
    // Basically does the same as `add()` but returns the added element instead
  , put: function(element, i) {
      this.add(element, i)
      return element
    }
    // Checks if the given element is a child
  , has: function(element) {
      return this.index(element) >= 0
    }
    // Gets index of given element
  , index: function(element) {
      return [].slice.call(this.node.childNodes).indexOf(element.node)
    }
    // Get a element at the given index
  , get: function(i) {
      return SVG.adopt(this.node.childNodes[i])
    }
    // Get first child
  , first: function() {
      return this.get(0)
    }
    // Get the last child
  , last: function() {
      return this.get(this.node.childNodes.length - 1)
    }
    // Iterates over all children and invokes a given block
  , each: function(block, deep) {
      var i, il
        , children = this.children()

      for (i = 0, il = children.length; i < il; i++) {
        if (children[i] instanceof SVG.Element)
          block.apply(children[i], [i, children])

        if (deep && (children[i] instanceof SVG.Container))
          children[i].each(block, deep)
      }

      return this
    }
    // Remove a given child
  , removeElement: function(element) {
      this.node.removeChild(element.node)

      return this
    }
    // Remove all elements in this container
  , clear: function() {
      // remove children
      while(this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild)

      // remove defs reference
      delete this._defs

      return this
    }
  , // Get defs
    defs: function() {
      return this.doc().defs()
    }
  }

})

SVG.extend(SVG.Parent, {

  ungroup: function(parent, depth) {
    if(depth === 0 || this instanceof SVG.Defs || this.node == SVG.parser.draw) return this

    parent = parent || (this instanceof SVG.Doc ? this : this.parent(SVG.Parent))
    depth = depth || Infinity

    this.each(function(){
      if(this instanceof SVG.Defs) return this
      if(this instanceof SVG.Parent) return this.ungroup(parent, depth-1)
      return this.toParent(parent)
    })

    this.node.firstChild || this.remove()

    return this
  },

  flatten: function(parent, depth) {
    return this.ungroup(parent, depth)
  }

})
SVG.Container = SVG.invent({
  // Initialize node
  create: function(element) {
    this.constructor.call(this, element)
  }

  // Inherit from
, inherit: SVG.Parent

})

SVG.ViewBox = SVG.invent({

  create: function(source) {
    var i, base = [0, 0, 0, 0]

    var x, y, width, height, box, view, we, he
      , wm   = 1 // width multiplier
      , hm   = 1 // height multiplier
      , reg  = /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi

    if(source instanceof SVG.Element){

      we = source
      he = source
      view = (source.attr('viewBox') || '').match(reg)
      box = source.bbox

      // get dimensions of current node
      width  = new SVG.Number(source.width())
      height = new SVG.Number(source.height())

      // find nearest non-percentual dimensions
      while (width.unit == '%') {
        wm *= width.value
        width = new SVG.Number(we instanceof SVG.Doc ? we.parent().offsetWidth : we.parent().width())
        we = we.parent()
      }
      while (height.unit == '%') {
        hm *= height.value
        height = new SVG.Number(he instanceof SVG.Doc ? he.parent().offsetHeight : he.parent().height())
        he = he.parent()
      }

      // ensure defaults
      this.x      = 0
      this.y      = 0
      this.width  = width  * wm
      this.height = height * hm
      this.zoom   = 1

      if (view) {
        // get width and height from viewbox
        x      = parseFloat(view[0])
        y      = parseFloat(view[1])
        width  = parseFloat(view[2])
        height = parseFloat(view[3])

        // calculate zoom accoring to viewbox
        this.zoom = ((this.width / this.height) > (width / height)) ?
          this.height / height :
          this.width  / width

        // calculate real pixel dimensions on parent SVG.Doc element
        this.x      = x
        this.y      = y
        this.width  = width
        this.height = height

      }

    }else{

      // ensure source as object
      source = typeof source === 'string' ?
        source.match(reg).map(function(el){ return parseFloat(el) }) :
      Array.isArray(source) ?
        source :
      typeof source == 'object' ?
        [source.x, source.y, source.width, source.height] :
      arguments.length == 4 ?
        [].slice.call(arguments) :
        base

      this.x = source[0]
      this.y = source[1]
      this.width = source[2]
      this.height = source[3]
    }


  }

, extend: {

    toString: function() {
      return this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height
    }
  , morph: function(x, y, width, height){
      this.destination = new SVG.ViewBox(x, y, width, height)
      return this
    }

  , at: function(pos) {

      if(!this.destination) return this

      return new SVG.ViewBox([
          this.x + (this.destination.x - this.x) * pos
        , this.y + (this.destination.y - this.y) * pos
        , this.width + (this.destination.width - this.width) * pos
        , this.height + (this.destination.height - this.height) * pos
      ])

    }

  }

  // Define parent
, parent: SVG.Container

  // Add parent method
, construct: {

    // get/set viewbox
    viewbox: function(x, y, width, height) {
      if (arguments.length == 0)
        // act as a getter if there are no arguments
        return new SVG.ViewBox(this)

      // otherwise act as a setter
      return this.attr('viewBox', new SVG.ViewBox(x, y, width, height))
    }

  }

})
// Add events to elements

;[ 'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mouseover',
  'mouseout',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'touchstart',
  'touchmove',
  'touchleave',
  'touchend',
  'touchcancel' ].forEach(function (event) {
    // add event to SVG.Element
    SVG.Element.prototype[event] = function (f) {
      // bind event to element rather than element node
      if (f == null) {
        SVG.off(this, event)
      } else {
        SVG.on(this, event, f)
      }
      return this
    }
  })

SVG.listenerId = 0

// Add event binder in the SVG namespace
SVG.on = function (node, events, listener, binding, options) {
  var l = listener.bind(binding || node)
  var n = node instanceof SVG.Element ? node.node : node

  // ensure instance object for nodes which are not adopted
  n.instance = n.instance || {_events: {}}

  var bag = n.instance._events

  // add id to listener
  if (!listener._svgjsListenerId) { listener._svgjsListenerId = ++SVG.listenerId }

  events.split(SVG.regex.delimiter).forEach(function (event) {
    var ev = event.split('.')[0]
    var ns = event.split('.')[1] || '*'

    // ensure valid object
    bag[ev] = bag[ev] || {}
    bag[ev][ns] = bag[ev][ns] || {}

    // reference listener
    bag[ev][ns][listener._svgjsListenerId] = l

    // add listener
    n.addEventListener(ev, l, options || false)
  })
}

// Add event unbinder in the SVG namespace
SVG.off = function (node, events, listener, options) {
  var n = node instanceof SVG.Element ? node.node : node
  if (!n.instance) return

  // listener can be a function or a number
  if (typeof listener === 'function') {
    listener = listener._svgjsListenerId
    if (!listener) return
  }

  var bag = n.instance._events

  ;(events || '').split(SVG.regex.delimiter).forEach(function (event) {
    var ev = event && event.split('.')[0]
    var ns = event && event.split('.')[1]
    var namespace, l

    if (listener) {
      // remove listener reference
      if (bag[ev] && bag[ev][ns || '*']) {
        // removeListener
        n.removeEventListener(ev, bag[ev][ns || '*'][listener], options || false)

        delete bag[ev][ns || '*'][listener]
      }
    } else if (ev && ns) {
      // remove all listeners for a namespaced event
      if (bag[ev] && bag[ev][ns]) {
        for (l in bag[ev][ns]) { SVG.off(n, [ev, ns].join('.'), l) }

        delete bag[ev][ns]
      }
    } else if (ns) {
      // remove all listeners for a specific namespace
      for (event in bag) {
        for (namespace in bag[event]) {
          if (ns === namespace) { SVG.off(n, [event, ns].join('.')) }
        }
      }
    } else if (ev) {
      // remove all listeners for the event
      if (bag[ev]) {
        for (namespace in bag[ev]) { SVG.off(n, [ev, namespace].join('.')) }

        delete bag[ev]
      }
    } else {
      // remove all listeners on a given node
      for (event in bag) { SVG.off(n, event) }

      n.instance._events = {}
    }
  })
}

SVG.extend(SVG.Element, {
  // Bind given event to listener
  on: function (event, listener, binding, options) {
    SVG.on(this, event, listener, binding, options)
    return this
  },
  // Unbind event from listener
  off: function (event, listener) {
    SVG.off(this.node, event, listener)
    return this
  },
  fire: function (event, data) {
    // Dispatch event
    if (event instanceof window.Event) {
      this.node.dispatchEvent(event)
    } else {
      this.node.dispatchEvent(event = new SVG.CustomEvent(event, {detail: data, cancelable: true}))
    }
    this._event = event
    return this
  },
  event: function() {
    return this._event
  }
})


SVG.Defs = SVG.invent({
  // Initialize node
  create: 'defs'

  // Inherit from
, inherit: SVG.Container

})
SVG.G = SVG.invent({
  // Initialize node
  create: 'g'

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Move over x-axis
    x: function(x) {
      return x == null ? this.transform('x') : this.transform({ x: x - this.x() }, true)
    }
    // Move over y-axis
  , y: function(y) {
      return y == null ? this.transform('y') : this.transform({ y: y - this.y() }, true)
    }
    // Move by center over x-axis
  , cx: function(x) {
      return x == null ? this.gbox().cx : this.x(x - this.gbox().width / 2)
    }
    // Move by center over y-axis
  , cy: function(y) {
      return y == null ? this.gbox().cy : this.y(y - this.gbox().height / 2)
    }
  , gbox: function() {

      var bbox  = this.bbox()
        , trans = this.transform()

      bbox.x  += trans.x
      bbox.x2 += trans.x
      bbox.cx += trans.x

      bbox.y  += trans.y
      bbox.y2 += trans.y
      bbox.cy += trans.y

      return bbox
    }
  }

  // Add parent method
, construct: {
    // Create a group element
    group: function() {
      return this.put(new SVG.G)
    }
  }
})

SVG.Doc = SVG.invent({
  // Initialize node
  create: function(element) {
    if (element) {
      // ensure the presence of a dom element
      element = typeof element == 'string' ?
        document.getElementById(element) :
        element

      // If the target is an svg element, use that element as the main wrapper.
      // This allows svg.js to work with svg documents as well.
      if (element.nodeName == 'svg') {
        this.constructor.call(this, element)
      } else {
        this.constructor.call(this, SVG.create('svg'))
        element.appendChild(this.node)
        this.size('100%', '100%')
      }

      // set svg element attributes and ensure defs node
      this.namespace().defs()
    }
  }

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Add namespaces
    namespace: function() {
      return this
        .attr({ xmlns: SVG.ns, version: '1.1' })
        .attr('xmlns:xlink', SVG.xlink, SVG.xmlns)
        .attr('xmlns:svgjs', SVG.svgjs, SVG.xmlns)
    }
    // Creates and returns defs element
  , defs: function() {
      if (!this._defs) {
        var defs

        // Find or create a defs element in this instance
        if (defs = this.node.getElementsByTagName('defs')[0])
          this._defs = SVG.adopt(defs)
        else
          this._defs = new SVG.Defs

        // Make sure the defs node is at the end of the stack
        this.node.appendChild(this._defs.node)
      }

      return this._defs
    }
    // custom parent method
  , parent: function() {
      if(!this.node.parentNode || this.node.parentNode.nodeName == '#document' || this.node.parentNode.nodeName == '#document-fragment') return null
      return this.node.parentNode
    }
    // Fix for possible sub-pixel offset. See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=608812
  , spof: function() {
      var pos = this.node.getScreenCTM()

      if (pos)
        this
          .style('left', (-pos.e % 1) + 'px')
          .style('top',  (-pos.f % 1) + 'px')

      return this
    }

      // Removes the doc from the DOM
  , remove: function() {
      if(this.parent()) {
        this.parent().removeChild(this.node)
      }

      return this
    }
  , clear: function() {
      // remove children
      while(this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild)

      // remove defs reference
      delete this._defs

      // add back parser
      if(!SVG.parser.draw.parentNode)
        this.node.appendChild(SVG.parser.draw)

      return this
    }
  , clone: function (parent) {
      // write dom data to the dom so the clone can pickup the data
      this.writeDataToDom()

      // get reference to node
      var node = this.node

      // clone element and assign new id
      var clone = assignNewId(node.cloneNode(true))

      // insert the clone in the given parent or after myself
      if(parent) {
        (parent.node || parent).appendChild(clone.node)
      } else {
        node.parentNode.insertBefore(clone.node, node.nextSibling)
      }

      return clone
    }
  }

})

// ### This module adds backward / forward functionality to elements.

//
SVG.extend(SVG.Element, {
  // Get all siblings, including myself
  siblings: function() {
    return this.parent().children()
  }
  // Get the curent position siblings
, position: function() {
    return this.parent().index(this)
  }
  // Get the next element (will return null if there is none)
, next: function() {
    return this.siblings()[this.position() + 1]
  }
  // Get the next element (will return null if there is none)
, previous: function() {
    return this.siblings()[this.position() - 1]
  }
  // Send given element one step forward
, forward: function() {
    var i = this.position() + 1
      , p = this.parent()

    // move node one step forward
    p.removeElement(this).add(this, i)

    // make sure defs node is always at the top
    if (p instanceof SVG.Doc)
      p.node.appendChild(p.defs().node)

    return this
  }
  // Send given element one step backward
, backward: function() {
    var i = this.position()

    if (i > 0)
      this.parent().removeElement(this).add(this, i - 1)

    return this
  }
  // Send given element all the way to the front
, front: function() {
    var p = this.parent()

    // Move node forward
    p.node.appendChild(this.node)

    // Make sure defs node is always at the top
    if (p instanceof SVG.Doc)
      p.node.appendChild(p.defs().node)

    return this
  }
  // Send given element all the way to the back
, back: function() {
    if (this.position() > 0)
      this.parent().removeElement(this).add(this, 0)

    return this
  }
  // Inserts a given element before the targeted element
, before: function(element) {
    element.remove()

    var i = this.position()

    this.parent().add(element, i)

    return this
  }
  // Insters a given element after the targeted element
, after: function(element) {
    element.remove()

    var i = this.position()

    this.parent().add(element, i + 1)

    return this
  }

})
SVG.Mask = SVG.invent({
  // Initialize node
  create: function() {
    this.constructor.call(this, SVG.create('mask'))

    // keep references to masked elements
    this.targets = []
  }

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Unmask all masked elements and remove itself
    remove: function() {
      // unmask all targets
      for (var i = this.targets.length - 1; i >= 0; i--)
        if (this.targets[i])
          this.targets[i].unmask()
      this.targets = []

      // remove mask from parent
      SVG.Element.prototype.remove.call(this)

      return this
    }
  }

  // Add parent method
, construct: {
    // Create masking element
    mask: function() {
      return this.defs().put(new SVG.Mask)
    }
  }
})


SVG.extend(SVG.Element, {
  // Distribute mask to svg element
  maskWith: function(element) {
    // use given mask or create a new one
    this.masker = element instanceof SVG.Mask ? element : this.parent().mask().add(element)

    // store reverence on self in mask
    this.masker.targets.push(this)

    // apply mask
    return this.attr('mask', 'url("#' + this.masker.attr('id') + '")')
  }
  // Unmask element
, unmask: function() {
    delete this.masker
    return this.attr('mask', null)
  }

})

SVG.ClipPath = SVG.invent({
  // Initialize node
  create: function() {
    this.constructor.call(this, SVG.create('clipPath'))

    // keep references to clipped elements
    this.targets = []
  }

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Unclip all clipped elements and remove itself
    remove: function() {
      // unclip all targets
      for (var i = this.targets.length - 1; i >= 0; i--)
        if (this.targets[i])
          this.targets[i].unclip()
      this.targets = []

      // remove clipPath from parent
      this.parent().removeElement(this)

      return this
    }
  }

  // Add parent method
, construct: {
    // Create clipping element
    clip: function() {
      return this.defs().put(new SVG.ClipPath)
    }
  }
})

//
SVG.extend(SVG.Element, {
  // Distribute clipPath to svg element
  clipWith: function(element) {
    // use given clip or create a new one
    this.clipper = element instanceof SVG.ClipPath ? element : this.parent().clip().add(element)

    // store reverence on self in mask
    this.clipper.targets.push(this)

    // apply mask
    return this.attr('clip-path', 'url("#' + this.clipper.attr('id') + '")')
  }
  // Unclip element
, unclip: function() {
    delete this.clipper
    return this.attr('clip-path', null)
  }

})
SVG.Gradient = SVG.invent({
  // Initialize node
  create: function(type) {
    this.constructor.call(this, SVG.create(type + 'Gradient'))

    // store type
    this.type = type
  }

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Add a color stop
    at: function(offset, color, opacity) {
      return this.put(new SVG.Stop).update(offset, color, opacity)
    }
    // Update gradient
  , update: function(block) {
      // remove all stops
      this.clear()

      // invoke passed block
      if (typeof block == 'function')
        block.call(this, this)

      return this
    }
    // Return the fill id
  , fill: function() {
      return 'url(#' + this.id() + ')'
    }
    // Alias string convertion to fill
  , toString: function() {
      return this.fill()
    }
    // custom attr to handle transform
  , attr: function(a, b, c) {
      if(a == 'transform') a = 'gradientTransform'
      return SVG.Container.prototype.attr.call(this, a, b, c)
    }
  }

  // Add parent method
, construct: {
    // Create gradient element in defs
    gradient: function(type, block) {
      return this.defs().gradient(type, block)
    }
  }
})

// Add animatable methods to both gradient and fx module
SVG.extend(SVG.Gradient, SVG.FX, {
  // From position
  from: function(x, y) {
    return (this._target || this).type == 'radial' ?
      this.attr({ fx: new SVG.Number(x), fy: new SVG.Number(y) }) :
      this.attr({ x1: new SVG.Number(x), y1: new SVG.Number(y) })
  }
  // To position
, to: function(x, y) {
    return (this._target || this).type == 'radial' ?
      this.attr({ cx: new SVG.Number(x), cy: new SVG.Number(y) }) :
      this.attr({ x2: new SVG.Number(x), y2: new SVG.Number(y) })
  }
})

// Base gradient generation
SVG.extend(SVG.Defs, {
  // define gradient
  gradient: function(type, block) {
    return this.put(new SVG.Gradient(type)).update(block)
  }

})

SVG.Stop = SVG.invent({
  // Initialize node
  create: 'stop'

  // Inherit from
, inherit: SVG.Element

  // Add class methods
, extend: {
    // add color stops
    update: function(o) {
      if (typeof o == 'number' || o instanceof SVG.Number) {
        o = {
          offset:  arguments[0]
        , color:   arguments[1]
        , opacity: arguments[2]
        }
      }

      // set attributes
      if (o.opacity != null) this.attr('stop-opacity', o.opacity)
      if (o.color   != null) this.attr('stop-color', o.color)
      if (o.offset  != null) this.attr('offset', new SVG.Number(o.offset))

      return this
    }
  }

})

SVG.Pattern = SVG.invent({
  // Initialize node
  create: 'pattern'

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Return the fill id
    fill: function() {
      return 'url(#' + this.id() + ')'
    }
    // Update pattern by rebuilding
  , update: function(block) {
      // remove content
      this.clear()

      // invoke passed block
      if (typeof block == 'function')
        block.call(this, this)

      return this
    }
    // Alias string convertion to fill
  , toString: function() {
      return this.fill()
    }
    // custom attr to handle transform
  , attr: function(a, b, c) {
      if(a == 'transform') a = 'patternTransform'
      return SVG.Container.prototype.attr.call(this, a, b, c)
    }

  }

  // Add parent method
, construct: {
    // Create pattern element in defs
    pattern: function(width, height, block) {
      return this.defs().pattern(width, height, block)
    }
  }
})

SVG.extend(SVG.Defs, {
  // Define gradient
  pattern: function(width, height, block) {
    return this.put(new SVG.Pattern).update(block).attr({
      x:            0
    , y:            0
    , width:        width
    , height:       height
    , patternUnits: 'userSpaceOnUse'
    })
  }

})
SVG.Shape = SVG.invent({
  // Initialize node
  create: function(element) {
    this.constructor.call(this, element)
  }

  // Inherit from
, inherit: SVG.Element

})

SVG.Bare = SVG.invent({
  // Initialize
  create: function(element, inherit) {
    // construct element
    this.constructor.call(this, SVG.create(element))

    // inherit custom methods
    if (inherit)
      for (var method in inherit.prototype)
        if (typeof inherit.prototype[method] === 'function')
          this[method] = inherit.prototype[method]
  }

  // Inherit from
, inherit: SVG.Element

  // Add methods
, extend: {
    // Insert some plain text
    words: function(text) {
      // remove contents
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild)

      // create text node
      this.node.appendChild(document.createTextNode(text))

      return this
    }
  }
})


SVG.extend(SVG.Parent, {
  // Create an element that is not described by SVG.js
  element: function(element, inherit) {
    return this.put(new SVG.Bare(element, inherit))
  }
})

SVG.Symbol = SVG.invent({
  // Initialize node
  create: 'symbol'

  // Inherit from
, inherit: SVG.Container

, construct: {
    // create symbol
    symbol: function() {
      return this.put(new SVG.Symbol)
    }
  }
})

SVG.Use = SVG.invent({
  // Initialize node
  create: 'use'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Use element as a reference
    element: function(element, file) {
      // Set lined element
      return this.attr('href', (file || '') + '#' + element, SVG.xlink)
    }
  }

  // Add parent method
, construct: {
    // Create a use element
    use: function(element, file) {
      return this.put(new SVG.Use).element(element, file)
    }
  }
})
SVG.Rect = SVG.invent({
  // Initialize node
  create: 'rect'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create a rect element
    rect: function(width, height) {
      return this.put(new SVG.Rect()).size(width, height)
    }
  }
})
SVG.Circle = SVG.invent({
  // Initialize node
  create: 'circle'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create circle element, based on ellipse
    circle: function(size) {
      return this.put(new SVG.Circle).rx(new SVG.Number(size).divide(2)).move(0, 0)
    }
  }
})

SVG.extend(SVG.Circle, SVG.FX, {
  // Radius x value
  rx: function(rx) {
    return this.attr('r', rx)
  }
  // Alias radius x value
, ry: function(ry) {
    return this.rx(ry)
  }
})

SVG.Ellipse = SVG.invent({
  // Initialize node
  create: 'ellipse'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create an ellipse
    ellipse: function(width, height) {
      return this.put(new SVG.Ellipse).size(width, height).move(0, 0)
    }
  }
})

SVG.extend(SVG.Ellipse, SVG.Rect, SVG.FX, {
  // Radius x value
  rx: function(rx) {
    return this.attr('rx', rx)
  }
  // Radius y value
, ry: function(ry) {
    return this.attr('ry', ry)
  }
})

// Add common method
SVG.extend(SVG.Circle, SVG.Ellipse, {
    // Move over x-axis
    x: function(x) {
      return x == null ? this.cx() - this.rx() : this.cx(x + this.rx())
    }
    // Move over y-axis
  , y: function(y) {
      return y == null ? this.cy() - this.ry() : this.cy(y + this.ry())
    }
    // Move by center over x-axis
  , cx: function(x) {
      return x == null ? this.attr('cx') : this.attr('cx', x)
    }
    // Move by center over y-axis
  , cy: function(y) {
      return y == null ? this.attr('cy') : this.attr('cy', y)
    }
    // Set width of element
  , width: function(width) {
      return width == null ? this.rx() * 2 : this.rx(new SVG.Number(width).divide(2))
    }
    // Set height of element
  , height: function(height) {
      return height == null ? this.ry() * 2 : this.ry(new SVG.Number(height).divide(2))
    }
    // Custom size function
  , size: function(width, height) {
      var p = proportionalSize(this, width, height)

      return this
        .rx(new SVG.Number(p.width).divide(2))
        .ry(new SVG.Number(p.height).divide(2))
    }
})
SVG.Line = SVG.invent({
  // Initialize node
  create: 'line'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Get array
    array: function() {
      return new SVG.PointArray([
        [ this.attr('x1'), this.attr('y1') ]
      , [ this.attr('x2'), this.attr('y2') ]
      ])
    }
    // Overwrite native plot() method
  , plot: function(x1, y1, x2, y2) {
      if (x1 == null)
        return this.array()
      else if (typeof y1 !== 'undefined')
        x1 = { x1: x1, y1: y1, x2: x2, y2: y2 }
      else
        x1 = new SVG.PointArray(x1).toLine()

      return this.attr(x1)
    }
    // Move by left top corner
  , move: function(x, y) {
      return this.attr(this.array().move(x, y).toLine())
    }
    // Set element size to given width and height
  , size: function(width, height) {
      var p = proportionalSize(this, width, height)

      return this.attr(this.array().size(p.width, p.height).toLine())
    }
  }

  // Add parent method
, construct: {
    // Create a line element
    line: function(x1, y1, x2, y2) {
      // make sure plot is called as a setter
      // x1 is not necessarily a number, it can also be an array, a string and a SVG.PointArray
      return SVG.Line.prototype.plot.apply(
        this.put(new SVG.Line)
      , x1 != null ? [x1, y1, x2, y2] : [0, 0, 0, 0]
      )
    }
  }
})

SVG.Polyline = SVG.invent({
  // Initialize node
  create: 'polyline'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create a wrapped polyline element
    polyline: function(p) {
      // make sure plot is called as a setter
      return this.put(new SVG.Polyline).plot(p || new SVG.PointArray)
    }
  }
})

SVG.Polygon = SVG.invent({
  // Initialize node
  create: 'polygon'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create a wrapped polygon element
    polygon: function(p) {
      // make sure plot is called as a setter
      return this.put(new SVG.Polygon).plot(p || new SVG.PointArray)
    }
  }
})

// Add polygon-specific functions
SVG.extend(SVG.Polyline, SVG.Polygon, {
  // Get array
  array: function() {
    return this._array || (this._array = new SVG.PointArray(this.attr('points')))
  }
  // Plot new path
, plot: function(p) {
    return (p == null) ?
      this.array() :
      this.clear().attr('points', typeof p == 'string' ? p : (this._array = new SVG.PointArray(p)))
  }
  // Clear array cache
, clear: function() {
    delete this._array
    return this
  }
  // Move by left top corner
, move: function(x, y) {
    return this.attr('points', this.array().move(x, y))
  }
  // Set element size to given width and height
, size: function(width, height) {
    var p = proportionalSize(this, width, height)

    return this.attr('points', this.array().size(p.width, p.height))
  }

})

// unify all point to point elements
SVG.extend(SVG.Line, SVG.Polyline, SVG.Polygon, {
  // Define morphable array
  morphArray:  SVG.PointArray
  // Move by left top corner over x-axis
, x: function(x) {
    return x == null ? this.bbox().x : this.move(x, this.bbox().y)
  }
  // Move by left top corner over y-axis
, y: function(y) {
    return y == null ? this.bbox().y : this.move(this.bbox().x, y)
  }
  // Set width of element
, width: function(width) {
    var b = this.bbox()

    return width == null ? b.width : this.size(width, b.height)
  }
  // Set height of element
, height: function(height) {
    var b = this.bbox()

    return height == null ? b.height : this.size(b.width, height)
  }
})
SVG.Path = SVG.invent({
  // Initialize node
  create: 'path'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Define morphable array
    morphArray:  SVG.PathArray
    // Get array
  , array: function() {
      return this._array || (this._array = new SVG.PathArray(this.attr('d')))
    }
    // Plot new path
  , plot: function(d) {
      return (d == null) ?
        this.array() :
        this.clear().attr('d', typeof d == 'string' ? d : (this._array = new SVG.PathArray(d)))
    }
    // Clear array cache
  , clear: function() {
      delete this._array
      return this
    }
    // Move by left top corner
  , move: function(x, y) {
      return this.attr('d', this.array().move(x, y))
    }
    // Move by left top corner over x-axis
  , x: function(x) {
      return x == null ? this.bbox().x : this.move(x, this.bbox().y)
    }
    // Move by left top corner over y-axis
  , y: function(y) {
      return y == null ? this.bbox().y : this.move(this.bbox().x, y)
    }
    // Set element size to given width and height
  , size: function(width, height) {
      var p = proportionalSize(this, width, height)

      return this.attr('d', this.array().size(p.width, p.height))
    }
    // Set width of element
  , width: function(width) {
      return width == null ? this.bbox().width : this.size(width, this.bbox().height)
    }
    // Set height of element
  , height: function(height) {
      return height == null ? this.bbox().height : this.size(this.bbox().width, height)
    }

  }

  // Add parent method
, construct: {
    // Create a wrapped path element
    path: function(d) {
      // make sure plot is called as a setter
      return this.put(new SVG.Path).plot(d || new SVG.PathArray)
    }
  }
})

SVG.Image = SVG.invent({
  // Initialize node
  create: 'image'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // (re)load image
    load: function(url) {
      if (!url) return this

      var self = this
        , img  = new window.Image()

      // preload image
      SVG.on(img, 'load', function() {
        SVG.off(img)

        var p = self.parent(SVG.Pattern)

        if(p === null) return

        // ensure image size
        if (self.width() == 0 && self.height() == 0)
          self.size(img.width, img.height)

        // ensure pattern size if not set
        if (p && p.width() == 0 && p.height() == 0)
          p.size(self.width(), self.height())

        // callback
        if (typeof self._loaded === 'function')
          self._loaded.call(self, {
            width:  img.width
          , height: img.height
          , ratio:  img.width / img.height
          , url:    url
          })
      })

      SVG.on(img, 'error', function(e){
        SVG.off(img)

        if (typeof self._error === 'function'){
            self._error.call(self, e)
        }
      })

      return this.attr('href', (img.src = this.src = url), SVG.xlink)
    }
    // Add loaded callback
  , loaded: function(loaded) {
      this._loaded = loaded
      return this
    }

  , error: function(error) {
      this._error = error
      return this
    }
  }

  // Add parent method
, construct: {
    // create image element, load image and set its size
    image: function(source, width, height) {
      return this.put(new SVG.Image).load(source).size(width || 0, height || width || 0)
    }
  }

})
SVG.Text = SVG.invent({
  // Initialize node
  create: function() {
    this.constructor.call(this, SVG.create('text'))

    this.dom.leading = new SVG.Number(1.3)    // store leading value for rebuilding
    this._rebuild = true                      // enable automatic updating of dy values
    this._build   = false                     // disable build mode for adding multiple lines

    // set default font
    this.attr('font-family', SVG.defaults.attrs['font-family'])
  }

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Move over x-axis
    x: function(x) {
      // act as getter
      if (x == null)
        return this.attr('x')

      return this.attr('x', x)
    }
    // Move over y-axis
  , y: function(y) {
      var oy = this.attr('y')
        , o  = typeof oy === 'number' ? oy - this.bbox().y : 0

      // act as getter
      if (y == null)
        return typeof oy === 'number' ? oy - o : oy

      return this.attr('y', typeof y.valueOf() === 'number' ? y + o : y)
    }
    // Move center over x-axis
  , cx: function(x) {
      return x == null ? this.bbox().cx : this.x(x - this.bbox().width / 2)
    }
    // Move center over y-axis
  , cy: function(y) {
      return y == null ? this.bbox().cy : this.y(y - this.bbox().height / 2)
    }
    // Set the text content
  , text: function(text) {
      // act as getter
      if (typeof text === 'undefined'){
        var text = ''
        var children = this.node.childNodes
        for(var i = 0, len = children.length; i < len; ++i){

          // add newline if its not the first child and newLined is set to true
          if(i != 0 && children[i].nodeType != 3 && SVG.adopt(children[i]).dom.newLined == true){
            text += '\n'
          }

          // add content of this node
          text += children[i].textContent
        }

        return text
      }

      // remove existing content
      this.clear().build(true)

      if (typeof text === 'function') {
        // call block
        text.call(this, this)

      } else {
        // store text and make sure text is not blank
        text = text.split('\n')

        // build new lines
        for (var i = 0, il = text.length; i < il; i++)
          this.tspan(text[i]).newLine()
      }

      // disable build mode and rebuild lines
      return this.build(false).rebuild()
    }
    // Set font size
  , size: function(size) {
      return this.attr('font-size', size).rebuild()
    }
    // Set / get leading
  , leading: function(value) {
      // act as getter
      if (value == null)
        return this.dom.leading

      // act as setter
      this.dom.leading = new SVG.Number(value)

      return this.rebuild()
    }
    // Get all the first level lines
  , lines: function() {
      var node = (this.textPath && this.textPath() || this).node

      // filter tspans and map them to SVG.js instances
      var lines = SVG.utils.map(SVG.utils.filterSVGElements(node.childNodes), function(el){
        return SVG.adopt(el)
      })

      // return an instance of SVG.set
      return new SVG.Set(lines)
    }
    // Rebuild appearance type
  , rebuild: function(rebuild) {
      // store new rebuild flag if given
      if (typeof rebuild == 'boolean')
        this._rebuild = rebuild

      // define position of all lines
      if (this._rebuild) {
        var self = this
          , blankLineOffset = 0
          , dy = this.dom.leading * new SVG.Number(this.attr('font-size'))

        this.lines().each(function() {
          if (this.dom.newLined) {
            if (!self.textPath())
              this.attr('x', self.attr('x'))
            if(this.text() == '\n') {
              blankLineOffset += dy
            }else{
              this.attr('dy', dy + blankLineOffset)
              blankLineOffset = 0
            }
          }
        })

        this.fire('rebuild')
      }

      return this
    }
    // Enable / disable build mode
  , build: function(build) {
      this._build = !!build
      return this
    }
    // overwrite method from parent to set data properly
  , setData: function(o){
      this.dom = o
      this.dom.leading = new SVG.Number(o.leading || 1.3)
      return this
    }
  }

  // Add parent method
, construct: {
    // Create text element
    text: function(text) {
      return this.put(new SVG.Text).text(text)
    }
    // Create plain text element
  , plain: function(text) {
      return this.put(new SVG.Text).plain(text)
    }
  }

})

SVG.Tspan = SVG.invent({
  // Initialize node
  create: 'tspan'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Set text content
    text: function(text) {
      if(text == null) return this.node.textContent + (this.dom.newLined ? '\n' : '')

      typeof text === 'function' ? text.call(this, this) : this.plain(text)

      return this
    }
    // Shortcut dx
  , dx: function(dx) {
      return this.attr('dx', dx)
    }
    // Shortcut dy
  , dy: function(dy) {
      return this.attr('dy', dy)
    }
    // Create new line
  , newLine: function() {
      // fetch text parent
      var t = this.parent(SVG.Text)

      // mark new line
      this.dom.newLined = true

      // apply new hy¡n
      return this.dy(t.dom.leading * t.attr('font-size')).attr('x', t.x())
    }
  }

})

SVG.extend(SVG.Text, SVG.Tspan, {
  // Create plain text node
  plain: function(text) {
    // clear if build mode is disabled
    if (this._build === false)
      this.clear()

    // create text node
    this.node.appendChild(document.createTextNode(text))

    return this
  }
  // Create a tspan
, tspan: function(text) {
    var node  = (this.textPath && this.textPath() || this).node
      , tspan = new SVG.Tspan

    // clear if build mode is disabled
    if (this._build === false)
      this.clear()

    // add new tspan
    node.appendChild(tspan.node)

    return tspan.text(text)
  }
  // Clear all lines
, clear: function() {
    var node = (this.textPath && this.textPath() || this).node

    // remove existing child nodes
    while (node.hasChildNodes())
      node.removeChild(node.lastChild)

    return this
  }
  // Get length of text element
, length: function() {
    return this.node.getComputedTextLength()
  }
})

SVG.TextPath = SVG.invent({
  // Initialize node
  create: 'textPath'

  // Inherit from
, inherit: SVG.Parent

  // Define parent class
, parent: SVG.Text

  // Add parent method
, construct: {
    morphArray: SVG.PathArray
    // Create path for text to run on
  , path: function(d) {
      // create textPath element
      var path  = new SVG.TextPath
        , track = this.doc().defs().path(d)

      // move lines to textpath
      while (this.node.hasChildNodes())
        path.node.appendChild(this.node.firstChild)

      // add textPath element as child node
      this.node.appendChild(path.node)

      // link textPath to path and add content
      path.attr('href', '#' + track, SVG.xlink)

      return this
    }
    // return the array of the path track element
  , array: function() {
      var track = this.track()

      return track ? track.array() : null
    }
    // Plot path if any
  , plot: function(d) {
      var track = this.track()
        , pathArray = null

      if (track) {
        pathArray = track.plot(d)
      }

      return (d == null) ? pathArray : this
    }
    // Get the path track element
  , track: function() {
      var path = this.textPath()

      if (path)
        return path.reference('href')
    }
    // Get the textPath child
  , textPath: function() {
      if (this.node.firstChild && this.node.firstChild.nodeName == 'textPath')
        return SVG.adopt(this.node.firstChild)
    }
  }
})

SVG.Nested = SVG.invent({
  // Initialize node
  create: function() {
    this.constructor.call(this, SVG.create('svg'))

    this.style('overflow', 'visible')
  }

  // Inherit from
, inherit: SVG.Container

  // Add parent method
, construct: {
    // Create nested svg document
    nested: function() {
      return this.put(new SVG.Nested)
    }
  }
})
SVG.A = SVG.invent({
  // Initialize node
  create: 'a'

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Link url
    to: function(url) {
      return this.attr('href', url, SVG.xlink)
    }
    // Link show attribute
  , show: function(target) {
      return this.attr('show', target, SVG.xlink)
    }
    // Link target attribute
  , target: function(target) {
      return this.attr('target', target)
    }
  }

  // Add parent method
, construct: {
    // Create a hyperlink element
    link: function(url) {
      return this.put(new SVG.A).to(url)
    }
  }
})

SVG.extend(SVG.Element, {
  // Create a hyperlink element
  linkTo: function(url) {
    var link = new SVG.A

    if (typeof url == 'function')
      url.call(link, link)
    else
      link.to(url)

    return this.parent().put(link).put(this)
  }

})
SVG.Marker = SVG.invent({
  // Initialize node
  create: 'marker'

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Set width of element
    width: function(width) {
      return this.attr('markerWidth', width)
    }
    // Set height of element
  , height: function(height) {
      return this.attr('markerHeight', height)
    }
    // Set marker refX and refY
  , ref: function(x, y) {
      return this.attr('refX', x).attr('refY', y)
    }
    // Update marker
  , update: function(block) {
      // remove all content
      this.clear()

      // invoke passed block
      if (typeof block == 'function')
        block.call(this, this)

      return this
    }
    // Return the fill id
  , toString: function() {
      return 'url(#' + this.id() + ')'
    }
  }

  // Add parent method
, construct: {
    marker: function(width, height, block) {
      // Create marker element in defs
      return this.defs().marker(width, height, block)
    }
  }

})

SVG.extend(SVG.Defs, {
  // Create marker
  marker: function(width, height, block) {
    // Set default viewbox to match the width and height, set ref to cx and cy and set orient to auto
    return this.put(new SVG.Marker)
      .size(width, height)
      .ref(width / 2, height / 2)
      .viewbox(0, 0, width, height)
      .attr('orient', 'auto')
      .update(block)
  }

})

SVG.extend(SVG.Line, SVG.Polyline, SVG.Polygon, SVG.Path, {
  // Create and attach markers
  marker: function(marker, width, height, block) {
    var attr = ['marker']

    // Build attribute name
    if (marker != 'all') attr.push(marker)
    attr = attr.join('-')

    // Set marker attribute
    marker = arguments[1] instanceof SVG.Marker ?
      arguments[1] :
      this.doc().marker(width, height, block)

    return this.attr(attr, marker)
  }

})
// Define list of available attributes for stroke and fill
var sugar = {
  stroke: ['color', 'width', 'opacity', 'linecap', 'linejoin', 'miterlimit', 'dasharray', 'dashoffset']
, fill:   ['color', 'opacity', 'rule']
, prefix: function(t, a) {
    return a == 'color' ? t : t + '-' + a
  }
}

// Add sugar for fill and stroke
;['fill', 'stroke'].forEach(function(m) {
  var i, extension = {}

  extension[m] = function(o) {
    if (typeof o == 'undefined')
      return this
    if (typeof o == 'string' || SVG.Color.isRgb(o) || (o && typeof o.fill === 'function'))
      this.attr(m, o)

    else
      // set all attributes from sugar.fill and sugar.stroke list
      for (i = sugar[m].length - 1; i >= 0; i--)
        if (o[sugar[m][i]] != null)
          this.attr(sugar.prefix(m, sugar[m][i]), o[sugar[m][i]])

    return this
  }

  SVG.extend(SVG.Element, SVG.FX, extension)

})

SVG.extend(SVG.Element, SVG.FX, {
  // Map rotation to transform
  rotate: function(d, cx, cy) {
    return this.transform({ rotation: d, cx: cx, cy: cy })
  }
  // Map skew to transform
, skew: function(x, y, cx, cy) {
    return arguments.length == 1  || arguments.length == 3 ?
      this.transform({ skew: x, cx: y, cy: cx }) :
      this.transform({ skewX: x, skewY: y, cx: cx, cy: cy })
  }
  // Map scale to transform
, scale: function(x, y, cx, cy) {
    return arguments.length == 1  || arguments.length == 3 ?
      this.transform({ scale: x, cx: y, cy: cx }) :
      this.transform({ scaleX: x, scaleY: y, cx: cx, cy: cy })
  }
  // Map translate to transform
, translate: function(x, y) {
    return this.transform({ x: x, y: y })
  }
  // Map flip to transform
, flip: function(a, o) {
    o = typeof a == 'number' ? a : o
    return this.transform({ flip: a || 'both', offset: o })
  }
  // Map matrix to transform
, matrix: function(m) {
    return this.attr('transform', new SVG.Matrix(arguments.length == 6 ? [].slice.call(arguments) : m))
  }
  // Opacity
, opacity: function(value) {
    return this.attr('opacity', value)
  }
  // Relative move over x axis
, dx: function(x) {
    return this.x(new SVG.Number(x).plus(this instanceof SVG.FX ? 0 : this.x()), true)
  }
  // Relative move over y axis
, dy: function(y) {
    return this.y(new SVG.Number(y).plus(this instanceof SVG.FX ? 0 : this.y()), true)
  }
  // Relative move over x and y axes
, dmove: function(x, y) {
    return this.dx(x).dy(y)
  }
})

SVG.extend(SVG.Rect, SVG.Ellipse, SVG.Circle, SVG.Gradient, SVG.FX, {
  // Add x and y radius
  radius: function(x, y) {
    var type = (this._target || this).type;
    return type == 'radial' || type == 'circle' ?
      this.attr('r', new SVG.Number(x)) :
      this.rx(x).ry(y == null ? x : y)
  }
})

SVG.extend(SVG.Path, {
  // Get path length
  length: function() {
    return this.node.getTotalLength()
  }
  // Get point at length
, pointAt: function(length) {
    return this.node.getPointAtLength(length)
  }
})

SVG.extend(SVG.Parent, SVG.Text, SVG.Tspan, SVG.FX, {
  // Set font
  font: function(a, v) {
    if (typeof a == 'object') {
      for (v in a) this.font(v, a[v])
    }

    return a == 'leading' ?
        this.leading(v) :
      a == 'anchor' ?
        this.attr('text-anchor', v) :
      a == 'size' || a == 'family' || a == 'weight' || a == 'stretch' || a == 'variant' || a == 'style' ?
        this.attr('font-'+ a, v) :
        this.attr(a, v)
  }
})

SVG.Set = SVG.invent({
  // Initialize
  create: function(members) {
    if (members instanceof SVG.Set) {
      this.members = members.members.slice()
    } else {
      Array.isArray(members) ? this.members = members : this.clear()
    }
  }

  // Add class methods
, extend: {
    // Add element to set
    add: function() {
      var i, il, elements = [].slice.call(arguments)

      for (i = 0, il = elements.length; i < il; i++)
        this.members.push(elements[i])

      return this
    }
    // Remove element from set
  , remove: function(element) {
      var i = this.index(element)

      // remove given child
      if (i > -1)
        this.members.splice(i, 1)

      return this
    }
    // Iterate over all members
  , each: function(block) {
      for (var i = 0, il = this.members.length; i < il; i++)
        block.apply(this.members[i], [i, this.members])

      return this
    }
    // Restore to defaults
  , clear: function() {
      // initialize store
      this.members = []

      return this
    }
    // Get the length of a set
  , length: function() {
      return this.members.length
    }
    // Checks if a given element is present in set
  , has: function(element) {
      return this.index(element) >= 0
    }
    // retuns index of given element in set
  , index: function(element) {
      return this.members.indexOf(element)
    }
    // Get member at given index
  , get: function(i) {
      return this.members[i]
    }
    // Get first member
  , first: function() {
      return this.get(0)
    }
    // Get last member
  , last: function() {
      return this.get(this.members.length - 1)
    }
    // Default value
  , valueOf: function() {
      return this.members
    }
    // Get the bounding box of all members included or empty box if set has no items
  , bbox: function(){
      // return an empty box of there are no members
      if (this.members.length == 0)
        return new SVG.RBox()

      // get the first rbox and update the target bbox
      var rbox = this.members[0].rbox(this.members[0].doc())

      this.each(function() {
        // user rbox for correct position and visual representation
        rbox = rbox.merge(this.rbox(this.doc()))
      })

      return rbox
    }
  }

  // Add parent method
, construct: {
    // Create a new set
    set: function(members) {
      return new SVG.Set(members)
    }
  }
})

SVG.FX.Set = SVG.invent({
  // Initialize node
  create: function(set) {
    // store reference to set
    this.set = set
  }

})

// Alias methods
SVG.Set.inherit = function() {
  var m
    , methods = []

  // gather shape methods
  for(var m in SVG.Shape.prototype)
    if (typeof SVG.Shape.prototype[m] == 'function' && typeof SVG.Set.prototype[m] != 'function')
      methods.push(m)

  // apply shape aliasses
  methods.forEach(function(method) {
    SVG.Set.prototype[method] = function() {
      for (var i = 0, il = this.members.length; i < il; i++)
        if (this.members[i] && typeof this.members[i][method] == 'function')
          this.members[i][method].apply(this.members[i], arguments)

      return method == 'animate' ? (this.fx || (this.fx = new SVG.FX.Set(this))) : this
    }
  })

  // clear methods for the next round
  methods = []

  // gather fx methods
  for(var m in SVG.FX.prototype)
    if (typeof SVG.FX.prototype[m] == 'function' && typeof SVG.FX.Set.prototype[m] != 'function')
      methods.push(m)

  // apply fx aliasses
  methods.forEach(function(method) {
    SVG.FX.Set.prototype[method] = function() {
      for (var i = 0, il = this.set.members.length; i < il; i++)
        this.set.members[i].fx[method].apply(this.set.members[i].fx, arguments)

      return this
    }
  })
}


SVG.extend(SVG.Element, {
  // Store data values on svg nodes
  data: function(a, v, r) {
    if (typeof a == 'object') {
      for (v in a)
        this.data(v, a[v])

    } else if (arguments.length < 2) {
      try {
        return JSON.parse(this.attr('data-' + a))
      } catch(e) {
        return this.attr('data-' + a)
      }

    } else {
      this.attr(
        'data-' + a
      , v === null ?
          null :
        r === true || typeof v === 'string' || typeof v === 'number' ?
          v :
          JSON.stringify(v)
      )
    }

    return this
  }
})
SVG.extend(SVG.Element, {
  // Remember arbitrary data
  remember: function(k, v) {
    // remember every item in an object individually
    if (typeof arguments[0] == 'object')
      for (var v in k)
        this.remember(v, k[v])

    // retrieve memory
    else if (arguments.length == 1)
      return this.memory()[k]

    // store memory
    else
      this.memory()[k] = v

    return this
  }

  // Erase a given memory
, forget: function() {
    if (arguments.length == 0)
      this._memory = {}
    else
      for (var i = arguments.length - 1; i >= 0; i--)
        delete this.memory()[arguments[i]]

    return this
  }

  // Initialize or return local memory object
, memory: function() {
    return this._memory || (this._memory = {})
  }

})
// Method for getting an element by id
SVG.get = function(id) {
  var node = document.getElementById(idFromReference(id) || id)
  return SVG.adopt(node)
}

// Select elements by query string
SVG.select = function(query, parent) {
  return new SVG.Set(
    SVG.utils.map((parent || document).querySelectorAll(query), function(node) {
      return SVG.adopt(node)
    })
  )
}

SVG.extend(SVG.Parent, {
  // Scoped select method
  select: function(query) {
    return SVG.select(query, this.node)
  }

})
function pathRegReplace(a, b, c, d) {
  return c + d.replace(SVG.regex.dots, ' .')
}

// creates deep clone of array
function array_clone(arr){
  var clone = arr.slice(0)
  for(var i = clone.length; i--;){
    if(Array.isArray(clone[i])){
      clone[i] = array_clone(clone[i])
    }
  }
  return clone
}

// tests if a given element is instance of an object
function is(el, obj){
  return el instanceof obj
}

// tests if a given selector matches an element
function matches(el, selector) {
  return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
}

// Convert dash-separated-string to camelCase
function camelCase(s) {
  return s.toLowerCase().replace(/-(.)/g, function(m, g) {
    return g.toUpperCase()
  })
}

// Capitalize first letter of a string
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Ensure to six-based hex
function fullHex(hex) {
  return hex.length == 4 ?
    [ '#',
      hex.substring(1, 2), hex.substring(1, 2)
    , hex.substring(2, 3), hex.substring(2, 3)
    , hex.substring(3, 4), hex.substring(3, 4)
    ].join('') : hex
}

// Component to hex value
function compToHex(comp) {
  var hex = comp.toString(16)
  return hex.length == 1 ? '0' + hex : hex
}

// Calculate proportional width and height values when necessary
function proportionalSize(element, width, height) {
  if (width == null || height == null) {
    var box = element.bbox()

    if (width == null)
      width = box.width / box.height * height
    else if (height == null)
      height = box.height / box.width * width
  }

  return {
    width:  width
  , height: height
  }
}

// Delta transform point
function deltaTransformPoint(matrix, x, y) {
  return {
    x: x * matrix.a + y * matrix.c + 0
  , y: x * matrix.b + y * matrix.d + 0
  }
}

// Map matrix array to object
function arrayToMatrix(a) {
  return { a: a[0], b: a[1], c: a[2], d: a[3], e: a[4], f: a[5] }
}

// Parse matrix if required
function parseMatrix(matrix) {
  if (!(matrix instanceof SVG.Matrix))
    matrix = new SVG.Matrix(matrix)

  return matrix
}

// Add centre point to transform object
function ensureCentre(o, target) {
  o.cx = o.cx == null ? target.bbox().cx : o.cx
  o.cy = o.cy == null ? target.bbox().cy : o.cy
}

// PathArray Helpers
function arrayToString(a) {
  for (var i = 0, il = a.length, s = ''; i < il; i++) {
    s += a[i][0]

    if (a[i][1] != null) {
      s += a[i][1]

      if (a[i][2] != null) {
        s += ' '
        s += a[i][2]

        if (a[i][3] != null) {
          s += ' '
          s += a[i][3]
          s += ' '
          s += a[i][4]

          if (a[i][5] != null) {
            s += ' '
            s += a[i][5]
            s += ' '
            s += a[i][6]

            if (a[i][7] != null) {
              s += ' '
              s += a[i][7]
            }
          }
        }
      }
    }
  }

  return s + ' '
}

// Deep new id assignment
function assignNewId(node) {
  // do the same for SVG child nodes as well
  for (var i = node.childNodes.length - 1; i >= 0; i--)
    if (node.childNodes[i] instanceof window.SVGElement)
      assignNewId(node.childNodes[i])

  return SVG.adopt(node).id(SVG.eid(node.nodeName))
}

// Add more bounding box properties
function fullBox(b) {
  if (b.x == null) {
    b.x      = 0
    b.y      = 0
    b.width  = 0
    b.height = 0
  }

  b.w  = b.width
  b.h  = b.height
  b.x2 = b.x + b.width
  b.y2 = b.y + b.height
  b.cx = b.x + b.width / 2
  b.cy = b.y + b.height / 2

  return b
}

// Get id from reference string
function idFromReference(url) {
  var m = (url || '').toString().match(SVG.regex.reference)

  if (m) return m[1]
}

// If values like 1e-88 are passed, this is not a valid 32 bit float,
// but in those cases, we are so close to 0 that 0 works well!
function float32String(v) {
  return Math.abs(v) > 1e-37 ? v : 0
}

// Create matrix array for looping
var abcdef = 'abcdef'.split('')

// Add CustomEvent to IE9 and IE10
if (typeof window.CustomEvent !== 'function') {
  // Code from: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
  var CustomEventPoly = function(event, options) {
    options = options || { bubbles: false, cancelable: false, detail: undefined }
    var e = document.createEvent('CustomEvent')
    e.initCustomEvent(event, options.bubbles, options.cancelable, options.detail)
    return e
  }

  CustomEventPoly.prototype = window.Event.prototype

  SVG.CustomEvent = CustomEventPoly
} else {
  SVG.CustomEvent = window.CustomEvent
}

// requestAnimationFrame / cancelAnimationFrame Polyfill with fallback based on Paul Irish
(function(w) {
  var lastTime = 0
  var vendors = ['moz', 'webkit']

  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    w.requestAnimationFrame = w[vendors[x] + 'RequestAnimationFrame']
    w.cancelAnimationFrame  = w[vendors[x] + 'CancelAnimationFrame'] ||
                              w[vendors[x] + 'CancelRequestAnimationFrame']
  }

  w.requestAnimationFrame = w.requestAnimationFrame ||
    function(callback) {
      var currTime = new Date().getTime()
      var timeToCall = Math.max(0, 16 - (currTime - lastTime))

      var id = w.setTimeout(function() {
        callback(currTime + timeToCall)
      }, timeToCall)

      lastTime = currTime + timeToCall
      return id
    }

  w.cancelAnimationFrame = w.cancelAnimationFrame || w.clearTimeout;

}(window))

return SVG

}));
},{}],2:[function(require,module,exports){
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.Tone=e():t.Tone=e()}("undefined"!=typeof self?self:this,function(){return function(t){var e={};function i(n){if(e[n])return e[n].exports;var o=e[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,i),o.l=!0,o.exports}return i.m=t,i.c=e,i.d=function(t,e,n){i.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:n})},i.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=155)}([function(t,e,i){(function(n){var o,s;
/**
 *  Tone.js
 *  @author Yotam Mann
 *  @license http://opensource.org/licenses/MIT MIT License
 *  @copyright 2014-2019 Yotam Mann
 */o=[i(153)],void 0===(s=function(t){"use strict";var e=function(){if(!(this instanceof e))throw new Error("constructor needs to be called with the 'new' keyword")};return e.prototype.toString=function(){for(var t in e){var i=t[0].match(/^[A-Z]$/),n=e[t]===this.constructor;if(e.isFunction(e[t])&&i&&n)return t}return"Tone"},e.prototype.dispose=function(){return this},e.prototype.set=function(t,i,n){if(e.isObject(t))n=i;else if(e.isString(t)){var o={};o[t]=i,t=o}t:for(var s in t){i=t[s];var r=this;if(-1!==s.indexOf(".")){for(var a=s.split("."),l=0;l<a.length-1;l++)if((r=r[a[l]])instanceof e){a.splice(0,l+1);var h=a.join(".");r.set(h,i);continue t}s=a[a.length-1]}var u=r[s];e.isUndef(u)||(e.Signal&&u instanceof e.Signal||e.Param&&u instanceof e.Param?u.value!==i&&(e.isUndef(n)?u.value=i:u.rampTo(i,n)):u instanceof AudioParam?u.value!==i&&(u.value=i):e.TimeBase&&u instanceof e.TimeBase?r[s]=i:u instanceof e?u.set(i):u!==i&&(r[s]=i))}return this},e.prototype.get=function(t){e.isUndef(t)?t=this._collectDefaults(this.constructor):e.isString(t)&&(t=[t]);for(var i={},n=0;n<t.length;n++){var o=t[n],s=this,r=i;if(-1!==o.indexOf(".")){for(var a=o.split("."),l=0;l<a.length-1;l++){var h=a[l];r[h]=r[h]||{},r=r[h],s=s[h]}o=a[a.length-1]}var u=s[o];e.isObject(t[o])?r[o]=u.get():e.Signal&&u instanceof e.Signal?r[o]=u.value:e.Param&&u instanceof e.Param?r[o]=u.value:u instanceof AudioParam?r[o]=u.value:u instanceof e?r[o]=u.get():!e.isFunction(u)&&e.isDefined(u)&&(r[o]=u)}return i},e.prototype._collectDefaults=function(t){var i=[];if(e.isDefined(t.defaults)&&(i=Object.keys(t.defaults)),e.isDefined(t._super))for(var n=this._collectDefaults(t._super),o=0;o<n.length;o++)-1===i.indexOf(n[o])&&i.push(n[o]);return i},e.defaults=function(t,i,n){var o={};if(1===t.length&&e.isObject(t[0]))o=t[0];else for(var s=0;s<i.length;s++)o[i[s]]=t[s];return e.isDefined(n.defaults)?e.defaultArg(o,n.defaults):e.isObject(n)?e.defaultArg(o,n):o},e.defaultArg=function(t,i){if(e.isObject(t)&&e.isObject(i)){var n={};for(var o in t)n[o]=e.defaultArg(i[o],t[o]);for(var s in i)n[s]=e.defaultArg(t[s],i[s]);return n}return e.isUndef(t)?i:t},e.prototype.log=function(){if(this.debug||this.toString()===e.global.TONE_DEBUG_CLASS){var t=Array.from(arguments);t.unshift(this.toString()+":"),console.log.apply(void 0,t)}},e.prototype.assert=function(t,e){if(!t)throw new Error(e)},e.connectSeries=function(){for(var t=arguments[0],i=1;i<arguments.length;i++){var n=arguments[i];t.connect(n),t=n}return e},e.isUndef=function(t){return void 0===t},e.isDefined=function(t){return!e.isUndef(t)},e.isFunction=function(t){return"function"==typeof t},e.isNumber=function(t){return"number"==typeof t},e.isObject=function(t){return"[object Object]"===Object.prototype.toString.call(t)&&t.constructor===Object},e.isBoolean=function(t){return"boolean"==typeof t},e.isArray=function(t){return Array.isArray(t)},e.isString=function(t){return"string"==typeof t},e.isNote=function(t){return e.isString(t)&&/^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i.test(t)},e.noOp=function(){},e.prototype._readOnly=function(t){if(Array.isArray(t))for(var e=0;e<t.length;e++)this._readOnly(t[e]);else Object.defineProperty(this,t,{writable:!1,enumerable:!0})},e.prototype._writable=function(t){if(Array.isArray(t))for(var e=0;e<t.length;e++)this._writable(t[e]);else Object.defineProperty(this,t,{writable:!0})},e.State={Started:"started",Stopped:"stopped",Paused:"paused"},e.global=e.isUndef(n)?window:n,e.equalPowerScale=function(t){var e=.5*Math.PI;return Math.sin(t*e)},e.dbToGain=function(t){return Math.pow(10,t/20)},e.gainToDb=function(t){return Math.log(t)/Math.LN10*20},e.intervalToFrequencyRatio=function(t){return Math.pow(2,t/12)},e.prototype.now=function(){return e.context.now()},e.now=function(){return e.context.now()},e.prototype.immediate=function(){return e.context.currentTime},e.immediate=function(){return e.context.currentTime},e.extend=function(t,i){function n(){}e.isUndef(i)&&(i=e),n.prototype=i.prototype,t.prototype=new n,t.prototype.constructor=t,t._super=i},e._audioContext=null,e.start=function(){return e.context.resume()},Object.defineProperty(e,"context",{get:function(){return e._audioContext},set:function(t){t.isContext?e._audioContext=t:e._audioContext=new e.Context(t),e.Context.emit("init",e._audioContext)}}),Object.defineProperty(e.prototype,"context",{get:function(){return e.context}}),e.setContext=function(t){e.context=t},Object.defineProperty(e.prototype,"blockTime",{get:function(){return 128/this.context.sampleRate}}),Object.defineProperty(e.prototype,"sampleTime",{get:function(){return 1/this.context.sampleRate}}),Object.defineProperty(e,"supported",{get:function(){var t=e.global.hasOwnProperty("AudioContext")||e.global.hasOwnProperty("webkitAudioContext"),i=e.global.hasOwnProperty("Promise");return t&&i}}),Object.defineProperty(e,"initialized",{get:function(){return Boolean(e.context)}}),e.getContext=function(t){if(e.initialized)t(e.context);else{var i=function(){t(e.context),e.Context.off("init",i)};e.Context.on("init",i)}return e},e.version=t,e}.apply(e,o))||(t.exports=s)}).call(this,i(154))},function(t,e,i){var n,o;n=[i(0),i(7),i(4),i(14),i(97),i(3)],void 0===(o=function(t){"use strict";return t.Signal=function(){var e=t.defaults(arguments,["value","units"],t.Signal);t.Param.call(this,e),this._constantSource=this.context.createConstantSource(),this._constantSource.start(0),this._param=this._constantSource.offset,this.value=e.value,this.output=this._constantSource,this.input=this._param=this.output.offset},t.extend(t.Signal,t.Param),t.Signal.defaults={value:0,units:t.Type.Default,convert:!0},t.Signal.prototype.connect=t.SignalBase.prototype.connect,t.Signal.prototype.disconnect=t.SignalBase.prototype.disconnect,t.Signal.prototype.getValueAtTime=function(e){return this._param.getValueAtTime?this._param.getValueAtTime(e):t.Param.prototype.getValueAtTime.call(this,e)},t.Signal.prototype.dispose=function(){return t.Param.prototype.dispose.call(this),this._constantSource.disconnect(),this._constantSource=null,this},t.Signal}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(20)],void 0===(o=function(t){return t.AudioNode=function(){t.call(this);var e=t.defaults(arguments,["context"],{context:t.context});this._context=e.context},t.extend(t.AudioNode),Object.defineProperty(t.AudioNode.prototype,"context",{get:function(){return this._context}}),t.AudioNode.prototype.createInsOuts=function(t,e){1===t?this.input=this.context.createGain():t>1&&(this.input=new Array(t)),1===e?this.output=this.context.createGain():e>1&&(this.output=new Array(e))},Object.defineProperty(t.AudioNode.prototype,"channelCount",{get:function(){return this.output.channelCount},set:function(t){return this.output.channelCount=t}}),Object.defineProperty(t.AudioNode.prototype,"channelCountMode",{get:function(){return this.output.channelCountMode},set:function(t){return this.output.channelCountMode=t}}),Object.defineProperty(t.AudioNode.prototype,"channelInterpretation",{get:function(){return this.output.channelInterpretation},set:function(t){return this.output.channelInterpretation=t}}),Object.defineProperty(t.AudioNode.prototype,"numberOfInputs",{get:function(){return this.input?t.isArray(this.input)?this.input.length:1:0}}),Object.defineProperty(t.AudioNode.prototype,"numberOfOutputs",{get:function(){return this.output?t.isArray(this.output)?this.output.length:1:0}}),t.AudioNode.prototype.connect=function(e,i,n){return t.isArray(this.output)?(i=t.defaultArg(i,0),this.output[i].connect(e,0,n)):this.output.connect(e,i,n),this},t.AudioNode.prototype.disconnect=function(e,i,n){t.isArray(this.output)?t.isNumber(e)?this.output[e].disconnect():(i=t.defaultArg(i,0),this.output[i].disconnect(e,0,n)):this.output.disconnect.apply(this.output,arguments)},t.AudioNode.prototype.chain=function(){for(var t=this,e=0;e<arguments.length;e++){var i=arguments[e];t.connect(i),t=i}return this},t.AudioNode.prototype.fan=function(){for(var t=0;t<arguments.length;t++)this.connect(arguments[t]);return this},t.global.AudioNode&&(AudioNode.prototype.chain=t.AudioNode.prototype.chain,AudioNode.prototype.fan=t.AudioNode.prototype.fan),t.AudioNode.prototype.dispose=function(){return t.isDefined(this.input)&&(this.input instanceof AudioNode&&this.input.disconnect(),this.input=null),t.isDefined(this.output)&&(this.output instanceof AudioNode&&this.output.disconnect(),this.output=null),this._context=null,this},t.AudioNode}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(14),i(4),i(2)],void 0===(o=function(t){"use strict";return t.Gain=function(){var e=t.defaults(arguments,["gain","units"],t.Gain);t.AudioNode.call(this,e),this.input=this.output=this._gainNode=this.context.createGain(),this.gain=new t.Param({param:this._gainNode.gain,units:e.units,value:e.gain,convert:e.convert}),this._readOnly("gain")},t.extend(t.Gain,t.AudioNode),t.Gain.defaults={gain:1,convert:!0},t.Gain.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._gainNode.disconnect(),this._gainNode=null,this._writable("gain"),this.gain.dispose(),this.gain=null},t.Gain}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(65),i(46),i(45),i(20)],void 0===(o=function(t){return t.Type={Default:"number",Time:"time",Frequency:"frequency",TransportTime:"transportTime",Ticks:"ticks",NormalRange:"normalRange",AudioRange:"audioRange",Decibels:"db",Interval:"interval",BPM:"bpm",Positive:"positive",Gain:"gain",Cents:"cents",Degrees:"degrees",MIDI:"midi",BarsBeatsSixteenths:"barsBeatsSixteenths",Samples:"samples",Hertz:"hertz",Note:"note",Milliseconds:"milliseconds",Seconds:"seconds",Notation:"notation"},t.prototype.toSeconds=function(e){return t.isNumber(e)?e:t.isUndef(e)?this.now():t.isString(e)||t.isObject(e)?new t.Time(e).toSeconds():e instanceof t.TimeBase?e.toSeconds():void 0},t.prototype.toFrequency=function(e){return t.isNumber(e)?e:t.isString(e)||t.isUndef(e)||t.isObject(e)?new t.Frequency(e).valueOf():e instanceof t.TimeBase?e.toFrequency():void 0},t.prototype.toTicks=function(e){return t.isNumber(e)||t.isString(e)||t.isObject(e)?new t.TransportTime(e).toTicks():t.isUndef(e)?t.Transport.ticks:e instanceof t.TimeBase?e.toTicks():void 0},t}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(14),i(3),i(36)],void 0===(o=function(t){"use strict";return t.Multiply=function(e){t.Signal.call(this),this.createInsOuts(2,0),this._mult=this.input[0]=this.output=new t.Gain,this._param=this.input[1]=this.output.gain,this.value=t.defaultArg(e,0),this.proxy=!1},t.extend(t.Multiply,t.Signal),t.Multiply.prototype.dispose=function(){return t.Signal.prototype.dispose.call(this),this._mult.dispose(),this._mult=null,this._param=null,this},t.Multiply}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(16),i(27),i(40),i(4),i(33),i(1),i(2)],void 0===(o=function(t){"use strict";return t.Source=function(e){e=t.defaultArg(e,t.Source.defaults),t.AudioNode.call(this),this._volume=this.output=new t.Volume(e.volume),this.volume=this._volume.volume,this._readOnly("volume"),this._state=new t.TimelineState(t.State.Stopped),this._state.memory=100,this._synced=!1,this._scheduled=[],this._volume.output.output.channelCount=2,this._volume.output.output.channelCountMode="explicit",this.mute=e.mute},t.extend(t.Source,t.AudioNode),t.Source.defaults={volume:0,mute:!1},Object.defineProperty(t.Source.prototype,"state",{get:function(){return this._synced?t.Transport.state===t.State.Started?this._state.getValueAtTime(t.Transport.seconds):t.State.Stopped:this._state.getValueAtTime(this.now())}}),Object.defineProperty(t.Source.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),t.Source.prototype._start=t.noOp,t.Source.prototype.restart=t.noOp,t.Source.prototype._stop=t.noOp,t.Source.prototype.start=function(e,i,n){if(e=t.isUndef(e)&&this._synced?t.Transport.seconds:this.toSeconds(e),this._state.getValueAtTime(e)===t.State.Started)this._state.cancel(e),this._state.setStateAtTime(t.State.Started,e),this.restart(e,i,n);else if(this._state.setStateAtTime(t.State.Started,e),this._synced){var o=this._state.get(e);o.offset=t.defaultArg(i,0),o.duration=n;var s=t.Transport.schedule(function(t){this._start(t,i,n)}.bind(this),e);this._scheduled.push(s),t.Transport.state===t.State.Started&&this._syncedStart(this.now(),t.Transport.seconds)}else this._start.apply(this,arguments);return this},t.Source.prototype.stop=function(e){if(e=t.isUndef(e)&&this._synced?t.Transport.seconds:this.toSeconds(e),this._synced){var i=t.Transport.schedule(this._stop.bind(this),e);this._scheduled.push(i)}else this._stop.apply(this,arguments);return this._state.cancel(e),this._state.setStateAtTime(t.State.Stopped,e),this},t.Source.prototype.sync=function(){return this._synced=!0,this._syncedStart=function(e,i){if(i>0){var n=this._state.get(i);if(n&&n.state===t.State.Started&&n.time!==i){var o,s=i-this.toSeconds(n.time);n.duration&&(o=this.toSeconds(n.duration)-s),this._start(e,this.toSeconds(n.offset)+s,o)}}}.bind(this),this._syncedStop=function(e){var i=t.Transport.getSecondsAtTime(Math.max(e-this.sampleTime,0));this._state.getValueAtTime(i)===t.State.Started&&this._stop(e)}.bind(this),t.Transport.on("start loopStart",this._syncedStart),t.Transport.on("stop pause loopEnd",this._syncedStop),this},t.Source.prototype.unsync=function(){this._synced&&(t.Transport.off("stop pause loopEnd",this._syncedStop),t.Transport.off("start loopStart",this._syncedStart)),this._synced=!1;for(var e=0;e<this._scheduled.length;e++){var i=this._scheduled[e];t.Transport.clear(i)}return this._scheduled=[],this._state.cancel(0),this},t.Source.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this.unsync(),this._scheduled=null,this._writable("volume"),this._volume.dispose(),this._volume=null,this.volume=null,this._state.dispose(),this._state=null},t.Source}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(36),i(98)],void 0===(o=function(t){"use strict";return t.WaveShaper=function(e,i){t.SignalBase.call(this),this._shaper=this.input=this.output=this.context.createWaveShaper(),this._curve=null,Array.isArray(e)?this.curve=e:isFinite(e)||t.isUndef(e)?this._curve=new Float32Array(t.defaultArg(e,1024)):t.isFunction(e)&&(this._curve=new Float32Array(t.defaultArg(i,1024)),this.setMap(e))},t.extend(t.WaveShaper,t.SignalBase),t.WaveShaper.prototype.setMap=function(t){for(var e=new Array(this._curve.length),i=0,n=this._curve.length;i<n;i++){var o=i/(n-1)*2-1;e[i]=t(o,i)}return this.curve=e,this},Object.defineProperty(t.WaveShaper.prototype,"curve",{get:function(){return this._shaper.curve},set:function(t){this._curve=new Float32Array(t),this._shaper.curve=this._curve}}),Object.defineProperty(t.WaveShaper.prototype,"oversample",{get:function(){return this._shaper.oversample},set:function(t){if(!["none","2x","4x"].includes(t))throw new RangeError("Tone.WaveShaper: oversampling must be either 'none', '2x', or '4x'");this._shaper.oversample=t}}),t.WaveShaper.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._shaper.disconnect(),this._shaper=null,this._curve=null,this},t.WaveShaper}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(23),i(2)],void 0===(o=function(t){"use strict";return t.Effect=function(){var e=t.defaults(arguments,["wet"],t.Effect);t.AudioNode.call(this),this.createInsOuts(1,1),this._dryWet=new t.CrossFade(e.wet),this.wet=this._dryWet.fade,this.effectSend=new t.Gain,this.effectReturn=new t.Gain,this.input.connect(this._dryWet.a),this.input.connect(this.effectSend),this.effectReturn.connect(this._dryWet.b),this._dryWet.connect(this.output),this._readOnly(["wet"])},t.extend(t.Effect,t.AudioNode),t.Effect.defaults={wet:1},t.Effect.prototype.connectEffect=function(t){return this.effectSend.chain(t,this.effectReturn),this},t.Effect.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._dryWet.dispose(),this._dryWet=null,this.effectSend.dispose(),this.effectSend=null,this.effectReturn.dispose(),this.effectReturn=null,this._writable(["wet"]),this.wet=null,this},t.Effect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(2)],void 0===(o=function(t){"use strict";return t.Filter=function(){var e=t.defaults(arguments,["frequency","type","rolloff"],t.Filter);t.AudioNode.call(this),this.createInsOuts(1,1),this._filters=[],this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=new t.Signal(0,t.Type.Cents),this.gain=new t.Signal({value:e.gain,convert:!0,type:t.Type.Decibels}),this.Q=new t.Signal(e.Q),this._type=e.type,this._rolloff=e.rolloff,this.rolloff=e.rolloff,this._readOnly(["detune","frequency","gain","Q"])},t.extend(t.Filter,t.AudioNode),t.Filter.defaults={type:"lowpass",frequency:350,rolloff:-12,Q:1,gain:0},Object.defineProperty(t.Filter.prototype,"type",{get:function(){return this._type},set:function(t){if(-1===["lowpass","highpass","bandpass","lowshelf","highshelf","notch","allpass","peaking"].indexOf(t))throw new TypeError("Tone.Filter: invalid type "+t);this._type=t;for(var e=0;e<this._filters.length;e++)this._filters[e].type=t}}),Object.defineProperty(t.Filter.prototype,"rolloff",{get:function(){return this._rolloff},set:function(e){e=parseInt(e,10);var i=[-12,-24,-48,-96].indexOf(e);if(-1===i)throw new RangeError("Tone.Filter: rolloff can only be -12, -24, -48 or -96");i+=1,this._rolloff=e,this.input.disconnect();for(var n=0;n<this._filters.length;n++)this._filters[n].disconnect(),this._filters[n]=null;this._filters=new Array(i);for(var o=0;o<i;o++){var s=this.context.createBiquadFilter();s.type=this._type,this.frequency.connect(s.frequency),this.detune.connect(s.detune),this.Q.connect(s.Q),this.gain.connect(s.gain),this._filters[o]=s}var r=[this.input].concat(this._filters).concat([this.output]);t.connectSeries.apply(t,r)}}),t.Filter.prototype.getFrequencyResponse=function(e){e=t.defaultArg(e,128);for(var i=new Float32Array(e).map(function(){return 1}),n=new Float32Array(e),o=0;o<e;o++){var s=19980*Math.pow(o/e,2)+20;n[o]=s}var r=new Float32Array(e),a=new Float32Array(e);return this._filters.forEach(function(){var t=this.context.createBiquadFilter();t.type=this._type,t.Q.value=this.Q.value,t.frequency.value=this.frequency.value,t.gain.value=this.gain.value,t.getFrequencyResponse(n,r,a),r.forEach(function(t,e){i[e]*=t})}.bind(this)),i},t.Filter.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this);for(var e=0;e<this._filters.length;e++)this._filters[e].disconnect(),this._filters[e]=null;return this._filters=null,this._writable(["detune","frequency","gain","Q"]),this.frequency.dispose(),this.Q.dispose(),this.frequency=null,this.Q=null,this.detune.dispose(),this.detune=null,this.gain.dispose(),this.gain=null,this},t.Filter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(2)],void 0===(o=function(t){"use strict";return t.Merge=function(){t.AudioNode.call(this),this.createInsOuts(2,0),this.left=this.input[0]=new t.Gain,this.right=this.input[1]=new t.Gain,this._merger=this.output=this.context.createChannelMerger(2),this.left.connect(this._merger,0,0),this.right.connect(this._merger,0,1),this.left.channelCount=1,this.right.channelCount=1,this.left.channelCountMode="explicit",this.right.channelCountMode="explicit"},t.extend(t.Merge,t.AudioNode),t.Merge.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.left.dispose(),this.left=null,this.right.dispose(),this.right=null,this._merger.disconnect(),this._merger=null,this},t.Merge}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(35),i(4),i(81)],void 0===(o=function(t){"use strict";return t.Buffer=function(){var e=t.defaults(arguments,["url","onload","onerror"],t.Buffer);t.call(this),this._buffer=null,this._reversed=e.reverse,this._xhr=null,this.onload=t.noOp,e.url instanceof AudioBuffer||e.url instanceof t.Buffer?(this.set(e.url),this.loaded||(this.onload=e.onload)):t.isString(e.url)&&this.load(e.url).then(e.onload).catch(e.onerror)},t.extend(t.Buffer),t.Buffer.defaults={url:void 0,reverse:!1,onload:t.noOp,onerror:t.noOp},t.Buffer.prototype.set=function(e){return e instanceof t.Buffer?e.loaded?this._buffer=e.get():e.onload=function(){this.set(e),this.onload(this)}.bind(this):this._buffer=e,this},t.Buffer.prototype.get=function(){return this._buffer},t.Buffer.prototype.load=function(e,i,n){return new Promise(function(o,s){this._xhr=t.Buffer.load(e,function(t){this._xhr=null,this.set(t),o(this),this.onload(this),i&&i(this)}.bind(this),function(t){this._xhr=null,s(t),n&&n(t)}.bind(this))}.bind(this))},t.Buffer.prototype.dispose=function(){return t.prototype.dispose.call(this),this._buffer=null,this._xhr&&(t.Buffer._removeFromDownloadQueue(this._xhr),this._xhr.abort(),this._xhr=null),this},Object.defineProperty(t.Buffer.prototype,"loaded",{get:function(){return this.length>0}}),Object.defineProperty(t.Buffer.prototype,"duration",{get:function(){return this._buffer?this._buffer.duration:0}}),Object.defineProperty(t.Buffer.prototype,"length",{get:function(){return this._buffer?this._buffer.length:0}}),Object.defineProperty(t.Buffer.prototype,"numberOfChannels",{get:function(){return this._buffer?this._buffer.numberOfChannels:0}}),t.Buffer.prototype.fromArray=function(t){var e=t[0].length>0,i=e?t.length:1,n=e?t[0].length:t.length,o=this.context.createBuffer(i,n,this.context.sampleRate);e||1!==i||(t=[t]);for(var s=0;s<i;s++)o.copyToChannel(t[s],s);return this._buffer=o,this},t.Buffer.prototype.toMono=function(e){if(t.isNumber(e))this.fromArray(this.toArray(e));else{for(var i=new Float32Array(this.length),n=this.numberOfChannels,o=0;o<n;o++)for(var s=this.toArray(o),r=0;r<s.length;r++)i[r]+=s[r];i=i.map(function(t){return t/n}),this.fromArray(i)}return this},t.Buffer.prototype.toArray=function(e){if(t.isNumber(e))return this.getChannelData(e);if(1===this.numberOfChannels)return this.toArray(0);for(var i=[],n=0;n<this.numberOfChannels;n++)i[n]=this.getChannelData(n);return i},t.Buffer.prototype.getChannelData=function(t){return this._buffer.getChannelData(t)},t.Buffer.prototype.slice=function(e,i){i=t.defaultArg(i,this.duration);for(var n=Math.floor(this.context.sampleRate*this.toSeconds(e)),o=Math.floor(this.context.sampleRate*this.toSeconds(i)),s=[],r=0;r<this.numberOfChannels;r++)s[r]=this.toArray(r).slice(n,o);return(new t.Buffer).fromArray(s)},t.Buffer.prototype._reverse=function(){if(this.loaded)for(var t=0;t<this.numberOfChannels;t++)Array.prototype.reverse.call(this.getChannelData(t));return this},Object.defineProperty(t.Buffer.prototype,"reverse",{get:function(){return this._reversed},set:function(t){this._reversed!==t&&(this._reversed=t,this._reverse())}}),t.Emitter.mixin(t.Buffer),t.Buffer._downloadQueue=[],t.Buffer.baseUrl="",t.Buffer.fromArray=function(e){return(new t.Buffer).fromArray(e)},t.Buffer.fromUrl=function(e){var i=new t.Buffer;return i.load(e).then(function(){return i})},t.Buffer._removeFromDownloadQueue=function(e){var i=t.Buffer._downloadQueue.indexOf(e);-1!==i&&t.Buffer._downloadQueue.splice(i,1)},t.Buffer.load=function(e,i,n){i=t.defaultArg(i,t.noOp);var o=e.match(/\[(.+\|?)+\]$/);if(o){for(var s=o[1].split("|"),r=s[0],a=0;a<s.length;a++)if(t.Buffer.supportsType(s[a])){r=s[a];break}e=e.replace(o[0],r)}function l(e){if(t.Buffer._removeFromDownloadQueue(u),t.Buffer.emit("error",e),!n)throw e;n(e)}function h(){for(var e=0,i=0;i<t.Buffer._downloadQueue.length;i++)e+=t.Buffer._downloadQueue[i].progress;t.Buffer.emit("progress",e/t.Buffer._downloadQueue.length)}var u=new XMLHttpRequest;return u.open("GET",t.Buffer.baseUrl+e,!0),u.responseType="arraybuffer",u.progress=0,t.Buffer._downloadQueue.push(u),u.addEventListener("load",function(){200===u.status?t.context.decodeAudioData(u.response).then(function(e){u.progress=1,h(),i(e),t.Buffer._removeFromDownloadQueue(u),0===t.Buffer._downloadQueue.length&&t.Buffer.emit("load")}).catch(function(){t.Buffer._removeFromDownloadQueue(u),l("Tone.Buffer: could not decode audio data: "+e)}):l("Tone.Buffer: could not locate file: "+e)}),u.addEventListener("error",l),u.addEventListener("progress",function(t){t.lengthComputable&&(u.progress=t.loaded/t.total*.95,h())}),u.send(),u},t.Buffer.cancelDownloads=function(){return t.Buffer._downloadQueue.slice().forEach(function(e){t.Buffer._removeFromDownloadQueue(e),e.abort()}),t.Buffer},t.Buffer.supportsType=function(t){var e=t.split(".");return e=e[e.length-1],""!==document.createElement("audio").canPlayType("audio/"+e)},t.loaded=function(){var e,i;function n(){t.Buffer.off("load",e),t.Buffer.off("error",i)}return new Promise(function(n,o){e=function(){n()},i=function(){o()},t.Buffer.on("load",e),t.Buffer.on("error",i)}).then(n).catch(function(t){throw n(),new Error(t)})},t.Buffer}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(17),i(26),i(2),i(1),i(22),i(4),i(28)],void 0===(o=function(t){"use strict";return t.LFO=function(){var e=t.defaults(arguments,["frequency","min","max"],t.LFO);t.AudioNode.call(this),this._oscillator=new t.Oscillator({frequency:e.frequency,type:e.type}),this.frequency=this._oscillator.frequency,this.amplitude=this._oscillator.volume,this.amplitude.units=t.Type.NormalRange,this.amplitude.value=e.amplitude,this._stoppedSignal=new t.Signal(0,t.Type.AudioRange),this._zeros=new t.Zero,this._stoppedValue=0,this._a2g=new t.AudioToGain,this._scaler=this.output=new t.Scale(e.min,e.max),this._units=t.Type.Default,this.units=e.units,this._oscillator.chain(this._a2g,this._scaler),this._zeros.connect(this._a2g),this._stoppedSignal.connect(this._a2g),this._readOnly(["amplitude","frequency"]),this.phase=e.phase},t.extend(t.LFO,t.AudioNode),t.LFO.defaults={type:"sine",min:0,max:1,phase:0,frequency:"4n",amplitude:1,units:t.Type.Default},t.LFO.prototype.start=function(t){return t=this.toSeconds(t),this._stoppedSignal.setValueAtTime(0,t),this._oscillator.start(t),this},t.LFO.prototype.stop=function(t){return t=this.toSeconds(t),this._stoppedSignal.setValueAtTime(this._stoppedValue,t),this._oscillator.stop(t),this},t.LFO.prototype.sync=function(){return this._oscillator.sync(),this._oscillator.syncFrequency(),this},t.LFO.prototype.unsync=function(){return this._oscillator.unsync(),this._oscillator.unsyncFrequency(),this},Object.defineProperty(t.LFO.prototype,"min",{get:function(){return this._toUnits(this._scaler.min)},set:function(t){t=this._fromUnits(t),this._scaler.min=t}}),Object.defineProperty(t.LFO.prototype,"max",{get:function(){return this._toUnits(this._scaler.max)},set:function(t){t=this._fromUnits(t),this._scaler.max=t}}),Object.defineProperty(t.LFO.prototype,"type",{get:function(){return this._oscillator.type},set:function(t){this._oscillator.type=t,this._stoppedValue=this._oscillator._getInitialValue(),this._stoppedSignal.value=this._stoppedValue}}),Object.defineProperty(t.LFO.prototype,"phase",{get:function(){return this._oscillator.phase},set:function(t){this._oscillator.phase=t,this._stoppedValue=this._oscillator._getInitialValue(),this._stoppedSignal.value=this._stoppedValue}}),Object.defineProperty(t.LFO.prototype,"units",{get:function(){return this._units},set:function(t){var e=this.min,i=this.max;this._units=t,this.min=e,this.max=i}}),Object.defineProperty(t.LFO.prototype,"mute",{get:function(){return this._oscillator.mute},set:function(t){this._oscillator.mute=t}}),Object.defineProperty(t.LFO.prototype,"state",{get:function(){return this._oscillator.state}}),t.LFO.prototype.connect=function(e){return e.constructor!==t.Signal&&e.constructor!==t.Param||(this.convert=e.convert,this.units=e.units),t.SignalBase.prototype.connect.apply(this,arguments),this},t.LFO.prototype._fromUnits=t.Param.prototype._fromUnits,t.LFO.prototype._toUnits=t.Param.prototype._toUnits,t.LFO.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["amplitude","frequency"]),this._oscillator.dispose(),this._oscillator=null,this._stoppedSignal.dispose(),this._stoppedSignal=null,this._zeros.dispose(),this._zeros=null,this._scaler.dispose(),this._scaler=null,this._a2g.dispose(),this._a2g=null,this.frequency=null,this.amplitude=null,this},t.LFO}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(29),i(94),i(1),i(3)],void 0===(o=function(t){"use strict";return t.Subtract=function(e){t.Signal.call(this),this.createInsOuts(2,0),this._sum=this.input[0]=this.output=new t.Gain,this._neg=new t.Negate,this._param=this.input[1]=new t.Signal(e),this._param.chain(this._neg,this._sum),this.proxy=!1},t.extend(t.Subtract,t.Signal),t.Subtract.prototype.dispose=function(){return t.Signal.prototype.dispose.call(this),this._neg.dispose(),this._neg=null,this._sum.disconnect(),this._sum=null,this},t.Subtract}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4),i(2),i(24)],void 0===(o=function(t){"use strict";return t.Param=function(){var e=t.defaults(arguments,["param","units","convert"],t.Param);t.AudioNode.call(this,e),this._param=this.input=e.param,this.units=e.units,this.convert=e.convert,this.overridden=!1,this._events=new t.Timeline(1e3),t.isDefined(e.value)&&this._param&&this.setValueAtTime(e.value,0)},t.extend(t.Param,t.AudioNode),t.Param.defaults={units:t.Type.Default,convert:!0,param:void 0},Object.defineProperty(t.Param.prototype,"value",{get:function(){var t=this.now();return this._toUnits(this.getValueAtTime(t))},set:function(t){this._initialValue=this._fromUnits(t),this.cancelScheduledValues(this.now()),this.setValueAtTime(t,this.now())}}),Object.defineProperty(t.Param.prototype,"minValue",{get:function(){return this.units===t.Type.Time||this.units===t.Type.Frequency||this.units===t.Type.NormalRange||this.units===t.Type.Positive||this.units===t.Type.BPM?0:this.units===t.Type.AudioRange?-1:this.units===t.Type.Decibels?-1/0:this._param.minValue}}),Object.defineProperty(t.Param.prototype,"maxValue",{get:function(){return this.units===t.Type.NormalRange||this.units===t.Type.AudioRange?1:this._param.maxValue}}),t.Param.prototype._fromUnits=function(e){if(!this.convert&&!t.isUndef(this.convert)||this.overridden)return e;switch(this.units){case t.Type.Time:return this.toSeconds(e);case t.Type.Frequency:return this.toFrequency(e);case t.Type.Decibels:return t.dbToGain(e);case t.Type.NormalRange:return Math.min(Math.max(e,0),1);case t.Type.AudioRange:return Math.min(Math.max(e,-1),1);case t.Type.Positive:return Math.max(e,0);default:return e}},t.Param.prototype._toUnits=function(e){if(!this.convert&&!t.isUndef(this.convert))return e;switch(this.units){case t.Type.Decibels:return t.gainToDb(e);default:return e}},t.Param.prototype._minOutput=1e-5,t.Param.AutomationType={Linear:"linearRampToValueAtTime",Exponential:"exponentialRampToValueAtTime",Target:"setTargetAtTime",SetValue:"setValueAtTime",Cancel:"cancelScheduledValues"},t.Param.prototype.setValueAtTime=function(e,i){return i=this.toSeconds(i),e=this._fromUnits(e),this._events.add({type:t.Param.AutomationType.SetValue,value:e,time:i}),this.log(t.Param.AutomationType.SetValue,e,i),this._param.setValueAtTime(e,i),this},t.Param.prototype.getValueAtTime=function(e){e=this.toSeconds(e);var i=this._events.getAfter(e),n=this._events.get(e),o=t.defaultArg(this._initialValue,this._param.defaultValue),s=o;if(null===n)s=o;else if(n.type===t.Param.AutomationType.Target){var r,a=this._events.getBefore(n.time);r=null===a?o:a.value,s=this._exponentialApproach(n.time,r,n.value,n.constant,e)}else s=null===i?n.value:i.type===t.Param.AutomationType.Linear?this._linearInterpolate(n.time,n.value,i.time,i.value,e):i.type===t.Param.AutomationType.Exponential?this._exponentialInterpolate(n.time,n.value,i.time,i.value,e):n.value;return s},t.Param.prototype.setRampPoint=function(t){t=this.toSeconds(t);var e=this.getValueAtTime(t);return this.cancelAndHoldAtTime(t),0===e&&(e=this._minOutput),this.setValueAtTime(this._toUnits(e),t),this},t.Param.prototype.linearRampToValueAtTime=function(e,i){return e=this._fromUnits(e),i=this.toSeconds(i),this._events.add({type:t.Param.AutomationType.Linear,value:e,time:i}),this.log(t.Param.AutomationType.Linear,e,i),this._param.linearRampToValueAtTime(e,i),this},t.Param.prototype.exponentialRampToValueAtTime=function(e,i){return e=this._fromUnits(e),e=Math.max(this._minOutput,e),i=this.toSeconds(i),this._events.add({type:t.Param.AutomationType.Exponential,time:i,value:e}),this.log(t.Param.AutomationType.Exponential,e,i),this._param.exponentialRampToValueAtTime(e,i),this},t.Param.prototype.exponentialRampTo=function(t,e,i){return i=this.toSeconds(i),this.setRampPoint(i),this.exponentialRampToValueAtTime(t,i+this.toSeconds(e)),this},t.Param.prototype.linearRampTo=function(t,e,i){return i=this.toSeconds(i),this.setRampPoint(i),this.linearRampToValueAtTime(t,i+this.toSeconds(e)),this},t.Param.prototype.targetRampTo=function(t,e,i){return i=this.toSeconds(i),this.setRampPoint(i),this.exponentialApproachValueAtTime(t,i,e),this},t.Param.prototype.exponentialApproachValueAtTime=function(t,e,i){var n=Math.log(this.toSeconds(i)+1)/Math.log(200);return e=this.toSeconds(e),this.setTargetAtTime(t,e,n)},t.Param.prototype.setTargetAtTime=function(e,i,n){if(e=this._fromUnits(e),n<=0)throw new Error("timeConstant must be greater than 0");return i=this.toSeconds(i),this._events.add({type:t.Param.AutomationType.Target,value:e,time:i,constant:n}),this.log(t.Param.AutomationType.Target,e,i,n),this._param.setTargetAtTime(e,i,n),this},t.Param.prototype.setValueCurveAtTime=function(e,i,n,o){o=t.defaultArg(o,1),n=this.toSeconds(n),i=this.toSeconds(i),this.setValueAtTime(e[0]*o,i);for(var s=n/(e.length-1),r=1;r<e.length;r++)this.linearRampToValueAtTime(e[r]*o,i+r*s);return this},t.Param.prototype.cancelScheduledValues=function(e){return e=this.toSeconds(e),this._events.cancel(e),this._param.cancelScheduledValues(e),this.log(t.Param.AutomationType.Cancel,e),this},t.Param.prototype.cancelAndHoldAtTime=function(e){var i=this.getValueAtTime(e);this.log("cancelAndHoldAtTime",e,"value="+i),this._param.cancelScheduledValues(e);var n=this._events.get(e),o=this._events.getAfter(e);return n&&n.time===e?o?this._events.cancel(o.time):this._events.cancel(e+this.sampleTime):o&&(this._events.cancel(o.time),o.type===t.Param.AutomationType.Linear?this.linearRampToValueAtTime(i,e):o.type===t.Param.AutomationType.Exponential&&this.exponentialRampToValueAtTime(i,e)),this._events.add({type:t.Param.AutomationType.SetValue,value:i,time:e}),this._param.setValueAtTime(i,e),this},t.Param.prototype.rampTo=function(e,i,n){return i=t.defaultArg(i,.1),this.units===t.Type.Frequency||this.units===t.Type.BPM||this.units===t.Type.Decibels?this.exponentialRampTo(e,i,n):this.linearRampTo(e,i,n),this},t.Param.prototype._exponentialApproach=function(t,e,i,n,o){return i+(e-i)*Math.exp(-(o-t)/n)},t.Param.prototype._linearInterpolate=function(t,e,i,n,o){return e+(o-t)/(i-t)*(n-e)},t.Param.prototype._exponentialInterpolate=function(t,e,i,n,o){return e*Math.pow(n/e,(o-t)/(i-t))},t.Param.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._param=null,this._events=null,this},t.Param}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(19),i(10),i(23)],void 0===(o=function(t){"use strict";return t.StereoEffect=function(){t.AudioNode.call(this);var e=t.defaults(arguments,["wet"],t.Effect);this.createInsOuts(1,1),this._dryWet=new t.CrossFade(e.wet),this.wet=this._dryWet.fade,this._split=new t.Split,this.effectSendL=this._split.left,this.effectSendR=this._split.right,this._merge=new t.Merge,this.effectReturnL=this._merge.left,this.effectReturnR=this._merge.right,this.input.connect(this._split),this.input.connect(this._dryWet,0,0),this._merge.connect(this._dryWet,0,1),this._dryWet.connect(this.output),this._readOnly(["wet"])},t.extend(t.StereoEffect,t.Effect),t.StereoEffect.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._dryWet.dispose(),this._dryWet=null,this._split.dispose(),this._split=null,this._merge.dispose(),this._merge=null,this.effectSendL=null,this.effectSendR=null,this.effectReturnL=null,this.effectReturnR=null,this._writable(["wet"]),this.wet=null,this},t.StereoEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(86),i(4),i(24),i(35),i(3),i(84),i(83),i(55)],void 0===(o=function(t){"use strict";t.Transport=function(){t.Emitter.call(this),t.getContext(function(){this.loop=!1,this._loopStart=0,this._loopEnd=0,this._ppq=e.defaults.PPQ,this._clock=new t.Clock({callback:this._processTick.bind(this),frequency:0}),this._bindClockEvents(),this.bpm=this._clock.frequency,this.bpm._toUnits=this._toUnits.bind(this),this.bpm._fromUnits=this._fromUnits.bind(this),this.bpm.units=t.Type.BPM,this.bpm.value=e.defaults.bpm,this._readOnly("bpm"),this._timeSignature=e.defaults.timeSignature,this._scheduledEvents={},this._timeline=new t.Timeline,this._repeatedEvents=new t.IntervalTimeline,this._syncedSignals=[],this._swingTicks=e.defaults.PPQ/2,this._swingAmount=0,this.context.transport=this}.bind(this))},t.extend(t.Transport,t.Emitter),t.Transport.defaults={bpm:120,swing:0,swingSubdivision:"8n",timeSignature:4,loopStart:0,loopEnd:"4m",PPQ:192},t.Transport.prototype.isTransport=!0,t.Transport.prototype._processTick=function(e,i){if(this._swingAmount>0&&i%this._ppq!=0&&i%(2*this._swingTicks)!=0){var n=i%(2*this._swingTicks)/(2*this._swingTicks),o=Math.sin(n*Math.PI)*this._swingAmount;e+=t.Ticks(2*this._swingTicks/3).toSeconds()*o}this.loop&&i>=this._loopEnd&&(this.emit("loopEnd",e),this._clock.setTicksAtTime(this._loopStart,e),i=this._loopStart,this.emit("loopStart",e,this._clock.getSecondsAtTime(e)),this.emit("loop",e)),this._timeline.forEachAtTime(i,function(t){t.invoke(e)})},t.Transport.prototype.schedule=function(e,i){var n=new t.TransportEvent(this,{time:t.TransportTime(i),callback:e});return this._addEvent(n,this._timeline)},t.Transport.prototype.scheduleRepeat=function(e,i,n,o){var s=new t.TransportRepeatEvent(this,{callback:e,interval:t.Time(i),time:t.TransportTime(n),duration:t.Time(t.defaultArg(o,1/0))});return this._addEvent(s,this._repeatedEvents)},t.Transport.prototype.scheduleOnce=function(e,i){var n=new t.TransportEvent(this,{time:t.TransportTime(i),callback:e,once:!0});return this._addEvent(n,this._timeline)},t.Transport.prototype.clear=function(t){if(this._scheduledEvents.hasOwnProperty(t)){var e=this._scheduledEvents[t.toString()];e.timeline.remove(e.event),e.event.dispose(),delete this._scheduledEvents[t.toString()]}return this},t.Transport.prototype._addEvent=function(t,e){return this._scheduledEvents[t.id.toString()]={event:t,timeline:e},e.add(t),t.id},t.Transport.prototype.cancel=function(e){return e=t.defaultArg(e,0),e=this.toTicks(e),this._timeline.forEachFrom(e,function(t){this.clear(t.id)}.bind(this)),this._repeatedEvents.forEachFrom(e,function(t){this.clear(t.id)}.bind(this)),this},t.Transport.prototype._bindClockEvents=function(){this._clock.on("start",function(e,i){i=t.Ticks(i).toSeconds(),this.emit("start",e,i)}.bind(this)),this._clock.on("stop",function(t){this.emit("stop",t)}.bind(this)),this._clock.on("pause",function(t){this.emit("pause",t)}.bind(this))},Object.defineProperty(t.Transport.prototype,"state",{get:function(){return this._clock.getStateAtTime(this.now())}}),t.Transport.prototype.start=function(e,i){return t.isDefined(i)&&(i=this.toTicks(i)),this._clock.start(e,i),this},t.Transport.prototype.stop=function(t){return this._clock.stop(t),this},t.Transport.prototype.pause=function(t){return this._clock.pause(t),this},t.Transport.prototype.toggle=function(e){return e=this.toSeconds(e),this._clock.getStateAtTime(e)!==t.State.Started?this.start(e):this.stop(e),this},Object.defineProperty(t.Transport.prototype,"timeSignature",{get:function(){return this._timeSignature},set:function(e){t.isArray(e)&&(e=e[0]/e[1]*4),this._timeSignature=e}}),Object.defineProperty(t.Transport.prototype,"loopStart",{get:function(){return t.Ticks(this._loopStart).toSeconds()},set:function(t){this._loopStart=this.toTicks(t)}}),Object.defineProperty(t.Transport.prototype,"loopEnd",{get:function(){return t.Ticks(this._loopEnd).toSeconds()},set:function(t){this._loopEnd=this.toTicks(t)}}),t.Transport.prototype.setLoopPoints=function(t,e){return this.loopStart=t,this.loopEnd=e,this},Object.defineProperty(t.Transport.prototype,"swing",{get:function(){return this._swingAmount},set:function(t){this._swingAmount=t}}),Object.defineProperty(t.Transport.prototype,"swingSubdivision",{get:function(){return t.Ticks(this._swingTicks).toNotation()},set:function(t){this._swingTicks=this.toTicks(t)}}),Object.defineProperty(t.Transport.prototype,"position",{get:function(){var e=this.now(),i=this._clock.getTicksAtTime(e);return t.Ticks(i).toBarsBeatsSixteenths()},set:function(t){var e=this.toTicks(t);this.ticks=e}}),Object.defineProperty(t.Transport.prototype,"seconds",{get:function(){return this._clock.seconds},set:function(t){var e=this.now(),i=this.bpm.timeToTicks(t,e);this.ticks=i}}),Object.defineProperty(t.Transport.prototype,"progress",{get:function(){if(this.loop){var t=this.now();return(this._clock.getTicksAtTime(t)-this._loopStart)/(this._loopEnd-this._loopStart)}return 0}}),Object.defineProperty(t.Transport.prototype,"ticks",{get:function(){return this._clock.ticks},set:function(e){if(this._clock.ticks!==e){var i=this.now();this.state===t.State.Started?(this.emit("stop",i),this._clock.setTicksAtTime(e,i),this.emit("start",i,this.seconds)):this._clock.setTicksAtTime(e,i)}}}),t.Transport.prototype.getTicksAtTime=function(t){return Math.round(this._clock.getTicksAtTime(t))},t.Transport.prototype.getSecondsAtTime=function(t){return this._clock.getSecondsAtTime(t)},Object.defineProperty(t.Transport.prototype,"PPQ",{get:function(){return this._ppq},set:function(t){var e=this.bpm.value;this._ppq=t,this.bpm.value=e}}),t.Transport.prototype._fromUnits=function(t){return 1/(60/t/this.PPQ)},t.Transport.prototype._toUnits=function(t){return t/this.PPQ*60},t.Transport.prototype.nextSubdivision=function(e){if(e=this.toTicks(e),this.state!==t.State.Started)return 0;var i=this.now(),n=e-this.getTicksAtTime(i)%e;return this._clock.nextTickTime(n,i)},t.Transport.prototype.syncSignal=function(e,i){if(!i){var n=this.now();i=0!==e.getValueAtTime(n)?e.getValueAtTime(n)/this.bpm.getValueAtTime(n):0}var o=new t.Gain(i);return this.bpm.chain(o,e._param),this._syncedSignals.push({ratio:o,signal:e,initial:e.value}),e.value=0,this},t.Transport.prototype.unsyncSignal=function(t){for(var e=this._syncedSignals.length-1;e>=0;e--){var i=this._syncedSignals[e];i.signal===t&&(i.ratio.dispose(),i.signal.value=i.initial,this._syncedSignals.splice(e,1))}return this},t.Transport.prototype.dispose=function(){return t.Emitter.prototype.dispose.call(this),this._clock.dispose(),this._clock=null,this._writable("bpm"),this.bpm=null,this._timeline.dispose(),this._timeline=null,this._repeatedEvents.dispose(),this._repeatedEvents=null,this};var e=t.Transport;return t.Transport=new e,t.Context.on("init",function(i){i.transport&&i.transport.isTransport?t.Transport=i.transport:t.Transport=new e}),t.Context.on("close",function(t){t.transport&&t.transport.isTransport&&t.transport.dispose()}),t.Transport}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(6),i(16),i(82)],void 0===(o=function(t){"use strict";return t.Oscillator=function(){var e=t.defaults(arguments,["frequency","type"],t.Oscillator);t.Source.call(this,e),this._oscillator=null,this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this._wave=null,this._partials=e.partials,this._partialCount=e.partialCount,this._phase=e.phase,this._type=e.type,e.partialCount&&e.type!==t.Oscillator.Type.Custom&&(this._type=this.baseType+e.partialCount.toString()),this.phase=this._phase,this._readOnly(["frequency","detune"])},t.extend(t.Oscillator,t.Source),t.Oscillator.defaults={type:"sine",frequency:440,detune:0,phase:0,partials:[],partialCount:0},t.Oscillator.Type={Sine:"sine",Triangle:"triangle",Sawtooth:"sawtooth",Square:"square",Custom:"custom"},t.Oscillator.prototype._start=function(e){this.log("start",e),this._oscillator=new t.OscillatorNode,this._wave?this._oscillator.setPeriodicWave(this._wave):this._oscillator.type=this._type,this._oscillator.connect(this.output),this.frequency.connect(this._oscillator.frequency),this.detune.connect(this._oscillator.detune),e=this.toSeconds(e),this._oscillator.start(e)},t.Oscillator.prototype._stop=function(t){return this.log("stop",t),this._oscillator&&(t=this.toSeconds(t),this._oscillator.stop(t)),this},t.Oscillator.prototype.restart=function(t){return this._oscillator&&this._oscillator.cancelStop(),this._state.cancel(this.toSeconds(t)),this},t.Oscillator.prototype.syncFrequency=function(){return t.Transport.syncSignal(this.frequency),this},t.Oscillator.prototype.unsyncFrequency=function(){return t.Transport.unsyncSignal(this.frequency),this},Object.defineProperty(t.Oscillator.prototype,"type",{get:function(){return this._type},set:function(t){var e=this._getRealImaginary(t,this._phase),i=this.context.createPeriodicWave(e[0],e[1]);this._wave=i,null!==this._oscillator&&this._oscillator.setPeriodicWave(this._wave),this._type=t}}),Object.defineProperty(t.Oscillator.prototype,"baseType",{get:function(){return this._type.replace(this.partialCount,"")},set:function(e){this.partialCount&&this._type!==t.Oscillator.Type.Custom&&e!==t.Oscillator.Type.Custom?this.type=e+this.partialCount:this.type=e}}),Object.defineProperty(t.Oscillator.prototype,"partialCount",{get:function(){return this._partialCount},set:function(e){var i=this._type,n=/^(sine|triangle|square|sawtooth)(\d+)$/.exec(this._type);n&&(i=n[1]),this._type!==t.Oscillator.Type.Custom&&(this.type=0===e?i:i+e.toString())}}),t.Oscillator.prototype.get=function(){const e=t.prototype.get.apply(this,arguments);return e.type!==t.Oscillator.Type.Custom&&delete e.partials,e},t.Oscillator.prototype._getRealImaginary=function(e,i){var n=2048,o=new Float32Array(n),s=new Float32Array(n),r=1;if(e===t.Oscillator.Type.Custom)r=this._partials.length+1,this._partialCount=this._partials.length,n=r;else{var a=/^(sine|triangle|square|sawtooth)(\d+)$/.exec(e);a?(r=parseInt(a[2])+1,this._partialCount=parseInt(a[2]),e=a[1],n=r=Math.max(r,2)):this._partialCount=0,this._partials=[]}for(var l=1;l<n;++l){var h,u=2/(l*Math.PI);switch(e){case t.Oscillator.Type.Sine:h=l<=r?1:0,this._partials[l-1]=h;break;case t.Oscillator.Type.Square:h=1&l?2*u:0,this._partials[l-1]=h;break;case t.Oscillator.Type.Sawtooth:h=u*(1&l?1:-1),this._partials[l-1]=h;break;case t.Oscillator.Type.Triangle:h=1&l?u*u*2*(l-1>>1&1?-1:1):0,this._partials[l-1]=h;break;case t.Oscillator.Type.Custom:h=this._partials[l-1];break;default:throw new TypeError("Tone.Oscillator: invalid type: "+e)}0!==h?(o[l]=-h*Math.sin(i*l),s[l]=h*Math.cos(i*l)):(o[l]=0,s[l]=0)}return[o,s]},t.Oscillator.prototype._inverseFFT=function(t,e,i){for(var n=0,o=t.length,s=0;s<o;s++)n+=t[s]*Math.cos(s*i)+e[s]*Math.sin(s*i);return n},t.Oscillator.prototype._getInitialValue=function(){for(var t=this._getRealImaginary(this._type,0),e=t[0],i=t[1],n=0,o=2*Math.PI,s=0;s<8;s++)n=Math.max(this._inverseFFT(e,i,s/8*o),n);return-this._inverseFFT(e,i,this._phase)/n},Object.defineProperty(t.Oscillator.prototype,"partials",{get:function(){return this._partials},set:function(e){this._partials=e,this.type=t.Oscillator.Type.Custom}}),Object.defineProperty(t.Oscillator.prototype,"phase",{get:function(){return this._phase*(180/Math.PI)},set:function(t){this._phase=t*Math.PI/180,this.type=this._type}}),t.Oscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),null!==this._oscillator&&(this._oscillator.dispose(),this._oscillator=null),this._wave=null,this._writable(["frequency","detune"]),this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this._partials=null,this},t.Oscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(14),i(2)],void 0===(o=function(t){"use strict";return t.Delay=function(){var e=t.defaults(arguments,["delayTime","maxDelay"],t.Delay);t.AudioNode.call(this,e),this._maxDelay=Math.max(this.toSeconds(e.maxDelay),this.toSeconds(e.delayTime)),this._delayNode=this.input=this.output=this.context.createDelay(this._maxDelay),this.delayTime=new t.Param({param:this._delayNode.delayTime,units:t.Type.Time,value:e.delayTime}),this._readOnly("delayTime")},t.extend(t.Delay,t.AudioNode),t.Delay.defaults={maxDelay:1,delayTime:0},Object.defineProperty(t.Delay.prototype,"maxDelay",{get:function(){return this._maxDelay}}),t.Delay.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._delayNode.disconnect(),this._delayNode=null,this._writable("delayTime"),this.delayTime=null,this},t.Delay}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(3),i(2)],void 0===(o=function(t){"use strict";return t.Split=function(){t.AudioNode.call(this),this.createInsOuts(0,2),this._splitter=this.input=this.context.createChannelSplitter(2),this.left=this.output[0]=new t.Gain,this.right=this.output[1]=new t.Gain,this._splitter.connect(this.left,0,0),this._splitter.connect(this.right,1,0)},t.extend(t.Split,t.AudioNode),t.Split.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._splitter.disconnect(),this.left.dispose(),this.left=null,this.right.dispose(),this.right=null,this._splitter=null,this},t.Split}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(35),i(24),i(34)],void 0===(o=function(t){t.Context=function(){t.Emitter.call(this);var i=t.defaults(arguments,["context"],t.Context);if(!i.context&&(i.context=new t.global.AudioContext,!i.context))throw new Error("could not create AudioContext. Possibly too many AudioContexts running already.");for(this._context=i.context;this._context.rawContext;)this._context=this._context.rawContext;for(var n in this._context)this._defineProperty(this._context,n);this._latencyHint=i.latencyHint,this._constants={},this.lookAhead=i.lookAhead,this._computedUpdateInterval=0,this._ticker=new e(this.emit.bind(this,"tick"),i.clockSource,i.updateInterval),this._timeouts=new t.Timeline,this._timeoutIds=0,this.on("tick",this._timeoutLoop.bind(this)),this._context.onstatechange=function(t){this.emit("statechange",t)}.bind(this)},t.extend(t.Context,t.Emitter),t.Emitter.mixin(t.Context),t.Context.defaults={clockSource:"worker",latencyHint:"interactive",lookAhead:.1,updateInterval:.03},t.Context.prototype.isContext=!0,t.Context.prototype._defineProperty=function(e,i){t.isUndef(this[i])&&Object.defineProperty(this,i,{get:function(){return"function"==typeof e[i]?e[i].bind(e):e[i]},set:function(t){e[i]=t}})},t.Context.prototype.now=function(){return this._context.currentTime+this.lookAhead},Object.defineProperty(t.Context.prototype,"destination",{get:function(){return this.master?this.master:this._context.destination}}),t.Context.prototype.resume=function(){return"suspended"===this._context.state&&this._context instanceof AudioContext?this._context.resume():Promise.resolve()},t.Context.prototype.close=function(){var e=Promise.resolve();return this!==t.global.TONE_AUDIO_CONTEXT&&(e=this.rawContext.close()),e.then(function(){t.Context.emit("close",this)}.bind(this))},t.Context.prototype.getConstant=function(t){if(this._constants[t])return this._constants[t];for(var e=this._context.createBuffer(1,128,this._context.sampleRate),i=e.getChannelData(0),n=0;n<i.length;n++)i[n]=t;var o=this._context.createBufferSource();return o.channelCount=1,o.channelCountMode="explicit",o.buffer=e,o.loop=!0,o.start(0),this._constants[t]=o,o},t.Context.prototype._timeoutLoop=function(){for(var t=this.now();this._timeouts&&this._timeouts.length&&this._timeouts.peek().time<=t;)this._timeouts.shift().callback()},t.Context.prototype.setTimeout=function(t,e){this._timeoutIds++;var i=this.now();return this._timeouts.add({callback:t,time:i+e,id:this._timeoutIds}),this._timeoutIds},t.Context.prototype.clearTimeout=function(t){return this._timeouts.forEach(function(e){e.id===t&&this.remove(e)}),this},Object.defineProperty(t.Context.prototype,"updateInterval",{get:function(){return this._ticker.updateInterval},set:function(t){this._ticker.updateInterval=t}}),Object.defineProperty(t.Context.prototype,"rawContext",{get:function(){return this._context}}),Object.defineProperty(t.Context.prototype,"clockSource",{get:function(){return this._ticker.type},set:function(t){this._ticker.type=t}}),Object.defineProperty(t.Context.prototype,"latencyHint",{get:function(){return this._latencyHint},set:function(e){var i=e;if(this._latencyHint=e,t.isString(e))switch(e){case"interactive":i=.1,this._context.latencyHint=e;break;case"playback":i=.8,this._context.latencyHint=e;break;case"balanced":i=.25,this._context.latencyHint=e;break;case"fastest":this._context.latencyHint="interactive",i=.01}this.lookAhead=i,this.updateInterval=i/3}}),t.Context.prototype.dispose=function(){return this.close().then(function(){for(var e in t.Emitter.prototype.dispose.call(this),this._ticker.dispose(),this._ticker=null,this._timeouts.dispose(),this._timeouts=null,this._constants)this._constants[e].disconnect();this._constants=null}.bind(this))};var e=function(e,i,n){this._type=i,this._updateInterval=n,this._callback=t.defaultArg(e,t.noOp),this._createClock()};if(e.Type={Worker:"worker",Timeout:"timeout",Offline:"offline"},e.prototype._createWorker=function(){t.global.URL=t.global.URL||t.global.webkitURL;var e=new Blob(["var timeoutTime = "+(1e3*this._updateInterval).toFixed(1)+";self.onmessage = function(msg){\ttimeoutTime = parseInt(msg.data);};function tick(){\tsetTimeout(tick, timeoutTime);\tself.postMessage('tick');}tick();"]),i=URL.createObjectURL(e),n=new Worker(i);n.onmessage=this._callback.bind(this),this._worker=n},e.prototype._createTimeout=function(){this._timeout=setTimeout(function(){this._createTimeout(),this._callback()}.bind(this),1e3*this._updateInterval)},e.prototype._createClock=function(){if(this._type===e.Type.Worker)try{this._createWorker()}catch(t){this._type=e.Type.Timeout,this._createClock()}else this._type===e.Type.Timeout&&this._createTimeout()},Object.defineProperty(e.prototype,"updateInterval",{get:function(){return this._updateInterval},set:function(t){this._updateInterval=Math.max(t,128/44100),this._type===e.Type.Worker&&this._worker.postMessage(Math.max(1e3*t,1))}}),Object.defineProperty(e.prototype,"type",{get:function(){return this._type},set:function(t){this._disposeClock(),this._type=t,this._createClock()}}),e.prototype._disposeClock=function(){this._timeout&&(clearTimeout(this._timeout),this._timeout=null),this._worker&&(this._worker.terminate(),this._worker.onmessage=null,this._worker=null)},e.prototype.dispose=function(){this._disposeClock(),this._callback=null},t.getContext(function(){var e=AudioNode.prototype.connect,i=AudioNode.prototype.disconnect;function n(i,n,o){if(i.input)return o=t.defaultArg(o,0),t.isArray(i.input)?this.connect(i.input[o]):this.connect(i.input,n,o);try{return i instanceof AudioNode?(e.call(this,i,n,o),i):(e.call(this,i,n),i)}catch(t){throw new Error("error connecting to node: "+i+"\n"+t)}}AudioNode.prototype.connect!==n&&(AudioNode.prototype.connect=n,AudioNode.prototype.disconnect=function(e,n,o){if(e&&e.input&&t.isArray(e.input))o=t.defaultArg(o,0),this.disconnect(e.input[o],n,0);else if(e&&e.input)this.disconnect(e.input,n,o);else try{e instanceof AudioParam?i.call(this,e,n):i.apply(this,arguments)}catch(t){throw new Error("error disconnecting node: "+e+"\n"+t)}})}),t.supported&&!t.initialized){if(t.global.TONE_AUDIO_CONTEXT||(t.global.TONE_AUDIO_CONTEXT=new t.Context),t.context=t.global.TONE_AUDIO_CONTEXT,!t.global.TONE_SILENCE_VERSION_LOGGING){var i="v";"dev"===t.version&&(i="");var n=" * Tone.js "+i+t.version+" * ";console.log("%c"+n,"background: #000; color: #fff")}}else t.supported||console.warn("This browser does not support Tone.js");return t.Context}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4),i(40)],void 0===(o=function(t){"use strict";return t.Instrument=function(e){e=t.defaultArg(e,t.Instrument.defaults),t.AudioNode.call(this),this._volume=this.output=new t.Volume(e.volume),this.volume=this._volume.volume,this._readOnly("volume"),this._scheduledEvents=[]},t.extend(t.Instrument,t.AudioNode),t.Instrument.defaults={volume:0},t.Instrument.prototype.triggerAttack=t.noOp,t.Instrument.prototype.triggerRelease=t.noOp,t.Instrument.prototype.sync=function(){return this._syncMethod("triggerAttack",1),this._syncMethod("triggerRelease",0),this},t.Instrument.prototype._syncMethod=function(e,i){var n=this["_original_"+e]=this[e];this[e]=function(){var e=Array.prototype.slice.call(arguments),o=e[i],s=t.Transport.schedule(function(t){e[i]=t,n.apply(this,e)}.bind(this),o);this._scheduledEvents.push(s)}.bind(this)},t.Instrument.prototype.unsync=function(){return this._scheduledEvents.forEach(function(e){t.Transport.clear(e)}),this._scheduledEvents=[],this._original_triggerAttack&&(this.triggerAttack=this._original_triggerAttack,this.triggerRelease=this._original_triggerRelease),this},t.Instrument.prototype.triggerAttackRelease=function(t,e,i,n){return i=this.toSeconds(i),e=this.toSeconds(e),this.triggerAttack(t,i,n),this.triggerRelease(i+e),this},t.Instrument.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._volume.dispose(),this._volume=null,this._writable(["volume"]),this.volume=null,this.unsync(),this._scheduledEvents=null,this},t.Instrument}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(1)],void 0===(o=function(t){"use strict";return t.AudioToGain=function(){t.SignalBase.call(this),this._norm=this.input=this.output=new t.WaveShaper(function(t){return(t+1)/2})},t.extend(t.AudioToGain,t.SignalBase),t.AudioToGain.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._norm.dispose(),this._norm=null,this},t.AudioToGain}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(13),i(93),i(3),i(2)],void 0===(o=function(t){"use strict";return t.CrossFade=function(e){t.AudioNode.call(this),this.createInsOuts(2,1),this.a=this.input[0]=new t.Gain,this.b=this.input[1]=new t.Gain,this.fade=new t.Signal(t.defaultArg(e,.5),t.Type.NormalRange),this._equalPowerA=new t.EqualPowerGain,this._equalPowerB=new t.EqualPowerGain,this._one=this.context.getConstant(1),this._invert=new t.Subtract,this.a.connect(this.output),this.b.connect(this.output),this.fade.chain(this._equalPowerB,this.b.gain),this._one.connect(this._invert,0,0),this.fade.connect(this._invert,0,1),this._invert.chain(this._equalPowerA,this.a.gain),this._readOnly("fade")},t.extend(t.CrossFade,t.AudioNode),t.CrossFade.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable("fade"),this._equalPowerA.dispose(),this._equalPowerA=null,this._equalPowerB.dispose(),this._equalPowerB=null,this.fade.dispose(),this.fade=null,this._invert.dispose(),this._invert=null,this._one=null,this.a.dispose(),this.a=null,this.b.dispose(),this.b=null,this},t.CrossFade}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){"use strict";return t.Timeline=function(){var e=t.defaults(arguments,["memory"],t.Timeline);t.call(this),this._timeline=[],this.memory=e.memory},t.extend(t.Timeline),t.Timeline.defaults={memory:1/0},Object.defineProperty(t.Timeline.prototype,"length",{get:function(){return this._timeline.length}}),t.Timeline.prototype.add=function(e){if(t.isUndef(e.time))throw new Error("Tone.Timeline: events must have a time attribute");e.time=e.time.valueOf();var i=this._search(e.time);if(this._timeline.splice(i+1,0,e),this.length>this.memory){var n=this.length-this.memory;this._timeline.splice(0,n)}return this},t.Timeline.prototype.remove=function(t){var e=this._timeline.indexOf(t);return-1!==e&&this._timeline.splice(e,1),this},t.Timeline.prototype.get=function(e,i){i=t.defaultArg(i,"time");var n=this._search(e,i);return-1!==n?this._timeline[n]:null},t.Timeline.prototype.peek=function(){return this._timeline[0]},t.Timeline.prototype.shift=function(){return this._timeline.shift()},t.Timeline.prototype.getAfter=function(e,i){i=t.defaultArg(i,"time");var n=this._search(e,i);return n+1<this._timeline.length?this._timeline[n+1]:null},t.Timeline.prototype.getBefore=function(e,i){i=t.defaultArg(i,"time");var n=this._timeline.length;if(n>0&&this._timeline[n-1][i]<e)return this._timeline[n-1];var o=this._search(e,i);return o-1>=0?this._timeline[o-1]:null},t.Timeline.prototype.cancel=function(t){if(this._timeline.length>1){var e=this._search(t);if(e>=0)if(this._timeline[e].time===t){for(var i=e;i>=0&&this._timeline[i].time===t;i--)e=i;this._timeline=this._timeline.slice(0,e)}else this._timeline=this._timeline.slice(0,e+1);else this._timeline=[]}else 1===this._timeline.length&&this._timeline[0].time>=t&&(this._timeline=[]);return this},t.Timeline.prototype.cancelBefore=function(t){var e=this._search(t);return e>=0&&(this._timeline=this._timeline.slice(e+1)),this},t.Timeline.prototype.previousEvent=function(t){var e=this._timeline.indexOf(t);return e>0?this._timeline[e-1]:null},t.Timeline.prototype._search=function(e,i){if(0===this._timeline.length)return-1;i=t.defaultArg(i,"time");var n=0,o=this._timeline.length,s=o;if(o>0&&this._timeline[o-1][i]<=e)return o-1;for(;n<s;){var r=Math.floor(n+(s-n)/2),a=this._timeline[r],l=this._timeline[r+1];if(a[i]===e){for(var h=r;h<this._timeline.length;h++){this._timeline[h][i]===e&&(r=h)}return r}if(a[i]<e&&l[i]>e)return r;a[i]>e?s=r:n=r+1}return-1},t.Timeline.prototype._iterate=function(e,i,n){i=t.defaultArg(i,0),n=t.defaultArg(n,this._timeline.length-1),this._timeline.slice(i,n+1).forEach(function(t){e.call(this,t)}.bind(this))},t.Timeline.prototype.forEach=function(t){return this._iterate(t),this},t.Timeline.prototype.forEachBefore=function(t,e){var i=this._search(t);return-1!==i&&this._iterate(e,0,i),this},t.Timeline.prototype.forEachAfter=function(t,e){var i=this._search(t);return this._iterate(e,i+1),this},t.Timeline.prototype.forEachBetween=function(t,e,i){var n=this._search(t),o=this._search(e);return-1!==n&&-1!==o?(this._timeline[n].time!==t&&(n+=1),this._timeline[o].time===e&&(o-=1),this._iterate(i,n,o)):-1===n&&this._iterate(i,0,o),this},t.Timeline.prototype.forEachFrom=function(t,e){for(var i=this._search(t);i>=0&&this._timeline[i].time>=t;)i--;return this._iterate(e,i+1),this},t.Timeline.prototype.forEachAtTime=function(t,e){var i=this._search(t);return-1!==i&&this._iterate(function(i){i.time===t&&e.call(this,i)},0,i),this},t.Timeline.prototype.dispose=function(){return t.prototype.dispose.call(this),this._timeline=null,this},t.Timeline}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(21),i(1)],void 0===(o=function(t){"use strict";return t.Monophonic=function(e){e=t.defaultArg(e,t.Monophonic.defaults),t.Instrument.call(this,e),this.portamento=e.portamento},t.extend(t.Monophonic,t.Instrument),t.Monophonic.defaults={portamento:0},t.Monophonic.prototype.triggerAttack=function(t,e,i){return this.log("triggerAttack",t,e,i),e=this.toSeconds(e),this._triggerEnvelopeAttack(e,i),this.setNote(t,e),this},t.Monophonic.prototype.triggerRelease=function(t){return this.log("triggerRelease",t),t=this.toSeconds(t),this._triggerEnvelopeRelease(t),this},t.Monophonic.prototype._triggerEnvelopeAttack=function(){},t.Monophonic.prototype._triggerEnvelopeRelease=function(){},t.Monophonic.prototype.getLevelAtTime=function(t){return t=this.toSeconds(t),this.envelope.getValueAtTime(t)},t.Monophonic.prototype.setNote=function(t,e){if(e=this.toSeconds(e),this.portamento>0&&this.getLevelAtTime(e)>.05){var i=this.toSeconds(this.portamento);this.frequency.exponentialRampTo(t,i,e)}else this.frequency.setValueAtTime(t,e);return this},t.Monophonic}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(29),i(5),i(1)],void 0===(o=function(t){"use strict";return t.Scale=function(e,i){t.SignalBase.call(this),this._outputMin=t.defaultArg(e,0),this._outputMax=t.defaultArg(i,1),this._scale=this.input=new t.Multiply(1),this._add=this.output=new t.Add(0),this._scale.connect(this._add),this._setRange()},t.extend(t.Scale,t.SignalBase),Object.defineProperty(t.Scale.prototype,"min",{get:function(){return this._outputMin},set:function(t){this._outputMin=t,this._setRange()}}),Object.defineProperty(t.Scale.prototype,"max",{get:function(){return this._outputMax},set:function(t){this._outputMax=t,this._setRange()}}),t.Scale.prototype._setRange=function(){this._add.value=this._outputMin,this._scale.value=this._outputMax-this._outputMin},t.Scale.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._add.dispose(),this._add=null,this._scale.dispose(),this._scale=null,this},t.Scale}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(3),i(2)],void 0===(o=function(t){"use strict";return t.Volume=function(){var e=t.defaults(arguments,["volume"],t.Volume);t.AudioNode.call(this,e),this.output=this.input=new t.Gain(e.volume,t.Type.Decibels),this._unmutedVolume=e.volume,this.volume=this.output.gain,this._readOnly("volume"),this.mute=e.mute},t.extend(t.Volume,t.AudioNode),t.Volume.defaults={volume:0,mute:!1},Object.defineProperty(t.Volume.prototype,"mute",{get:function(){return this.volume.value===-1/0},set:function(t){!this.mute&&t?(this._unmutedVolume=this.volume.value,this.volume.value=-1/0):this.mute&&!t&&(this.volume.value=this._unmutedVolume)}}),t.Volume.prototype.dispose=function(){return this.input.dispose(),t.AudioNode.prototype.dispose.call(this),this._writable("volume"),this.volume.dispose(),this.volume=null,this},t.Volume}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(3),i(36)],void 0===(o=function(t){return t.Zero=function(){t.SignalBase.call(this),this._gain=this.input=this.output=new t.Gain,this.context.getConstant(0).connect(this._gain)},t.extend(t.Zero,t.SignalBase),t.Zero.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._gain.dispose(),this._gain=null,this},t.Zero}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(3)],void 0===(o=function(t){"use strict";return t.Add=function(e){t.Signal.call(this),this.createInsOuts(2,0),this._sum=this.input[0]=this.input[1]=this.output=new t.Gain,this._param=this.input[1]=new t.Signal(e),this._param.connect(this._sum),this.proxy=!1},t.extend(t.Add,t.Signal),t.Add.prototype.dispose=function(){return t.Signal.prototype.dispose.call(this),this._sum.dispose(),this._sum=null,this},t.Add}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(47),i(3)],void 0===(o=function(t){"use strict";return t.AmplitudeEnvelope=function(){t.Envelope.apply(this,arguments),this.input=this.output=new t.Gain,this._sig.connect(this.output.gain)},t.extend(t.AmplitudeEnvelope,t.Envelope),t.AmplitudeEnvelope.prototype.dispose=function(){return t.Envelope.prototype.dispose.call(this),this},t.AmplitudeEnvelope}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11),i(6),i(3),i(2),i(63)],void 0===(o=function(t){return t.BufferSource=function(){var e=t.defaults(arguments,["buffer","onload"],t.BufferSource);t.AudioNode.call(this,e),this.onended=e.onended,this._startTime=-1,this._sourceStarted=!1,this._sourceStopped=!1,this._stopTime=-1,this._gainNode=this.output=new t.Gain(0),this._source=this.context.createBufferSource(),this._source.connect(this._gainNode),this._source.onended=this._onended.bind(this),this._buffer=new t.Buffer(e.buffer,e.onload),this.playbackRate=new t.Param({param:this._source.playbackRate,units:t.Type.Positive,value:e.playbackRate}),this.fadeIn=e.fadeIn,this.fadeOut=e.fadeOut,this.curve=e.curve,this._onendedTimeout=-1,this.loop=e.loop,this.loopStart=e.loopStart,this.loopEnd=e.loopEnd},t.extend(t.BufferSource,t.AudioNode),t.BufferSource.defaults={onended:t.noOp,onload:t.noOp,loop:!1,loopStart:0,loopEnd:0,fadeIn:0,fadeOut:0,curve:"linear",playbackRate:1},Object.defineProperty(t.BufferSource.prototype,"state",{get:function(){return this.getStateAtTime(this.now())}}),t.BufferSource.prototype.getStateAtTime=function(e){return e=this.toSeconds(e),-1!==this._startTime&&this._startTime<=e&&(-1===this._stopTime||e<this._stopTime)&&!this._sourceStopped?t.State.Started:t.State.Stopped},t.BufferSource.prototype.start=function(e,i,n,o){this.log("start",e,i,n,o),this.assert(-1===this._startTime,"can only be started once"),this.assert(this.buffer.loaded,"buffer is either not set or not loaded"),this.assert(!this._sourceStopped,"source is already stopped"),e=this.toSeconds(e),i=this.loop?t.defaultArg(i,this.loopStart):t.defaultArg(i,0),i=this.toSeconds(i),i=Math.max(i,0),o=t.defaultArg(o,1);var s=this.toSeconds(this.fadeIn);if(s>0?(this._gainNode.gain.setValueAtTime(0,e),"linear"===this.curve?this._gainNode.gain.linearRampToValueAtTime(o,e+s):this._gainNode.gain.exponentialApproachValueAtTime(o,e,s)):this._gainNode.gain.setValueAtTime(o,e),this._startTime=e,t.isDefined(n)){var r=this.toSeconds(n);r=Math.max(r,0),this.stop(e+r)}if(this.loop){var a=this.loopEnd||this.buffer.duration,l=this.loopStart;i>=a&&(i=(i-l)%(a-l)+l)}return this._source.buffer=this.buffer.get(),this._source.loopEnd=this.loopEnd||this.buffer.duration,i<this.buffer.duration&&(this._sourceStarted=!0,this._source.start(e,i)),this},t.BufferSource.prototype.stop=function(e){this.log("stop",e),this.assert(this.buffer.loaded,"buffer is either not set or not loaded"),this.assert(!this._sourceStopped,"source is already stopped"),e=this.toSeconds(e),-1!==this._stopTime&&this.cancelStop();var i=this.toSeconds(this.fadeOut);return this._stopTime=e+i,i>0?"linear"===this.curve?this._gainNode.gain.linearRampTo(0,i,e):this._gainNode.gain.targetRampTo(0,i,e):(this._gainNode.gain.cancelAndHoldAtTime(e),this._gainNode.gain.setValueAtTime(0,e)),t.context.clearTimeout(this._onendedTimeout),this._onendedTimeout=t.context.setTimeout(this._onended.bind(this),this._stopTime-this.now()),this},t.BufferSource.prototype.cancelStop=function(){if(-1!==this._startTime&&!this._sourceStopped){var t=this.toSeconds(this.fadeIn);this._gainNode.gain.cancelScheduledValues(this._startTime+t+this.sampleTime),this.context.clearTimeout(this._onendedTimeout),this._stopTime=-1}return this},t.BufferSource.prototype._onended=function(){if(!this._sourceStopped){this._sourceStopped=!0;var t="exponential"===this.curve?2*this.fadeOut:0;this._sourceStarted&&-1!==this._stopTime&&this._source.stop(this._stopTime+t),this.onended(this)}},Object.defineProperty(t.BufferSource.prototype,"loopStart",{get:function(){return this._source.loopStart},set:function(t){this._source.loopStart=this.toSeconds(t)}}),Object.defineProperty(t.BufferSource.prototype,"loopEnd",{get:function(){return this._source.loopEnd},set:function(t){this._source.loopEnd=this.toSeconds(t)}}),Object.defineProperty(t.BufferSource.prototype,"buffer",{get:function(){return this._buffer},set:function(t){this._buffer.set(t)}}),Object.defineProperty(t.BufferSource.prototype,"loop",{get:function(){return this._source.loop},set:function(t){this._source.loop=t,this.cancelStop()}}),t.BufferSource.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.onended=null,this._source.onended=null,this._source.disconnect(),this._source=null,this._gainNode.dispose(),this._gainNode=null,this._buffer.dispose(),this._buffer=null,this._startTime=-1,this.playbackRate=null,t.context.clearTimeout(this._onendedTimeout),this},t.BufferSource}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(1),i(5),i(3)],void 0===(o=function(t){"use strict";return t.FeedbackEffect=function(){var e=t.defaults(arguments,["feedback"],t.FeedbackEffect);t.Effect.call(this,e),this._feedbackGain=new t.Gain(e.feedback,t.Type.NormalRange),this.feedback=this._feedbackGain.gain,this.effectReturn.chain(this._feedbackGain,this.effectSend),this._readOnly(["feedback"])},t.extend(t.FeedbackEffect,t.Effect),t.FeedbackEffect.defaults={feedback:.125},t.FeedbackEffect.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._writable(["feedback"]),this._feedbackGain.dispose(),this._feedbackGain=null,this.feedback=null,this},t.FeedbackEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(24),i(4)],void 0===(o=function(t){"use strict";return t.TimelineState=function(e){t.Timeline.call(this),this._initial=e},t.extend(t.TimelineState,t.Timeline),t.TimelineState.prototype.getValueAtTime=function(t){var e=this.get(t);return null!==e?e.state:this._initial},t.TimelineState.prototype.setStateAtTime=function(t,e){return this.add({state:t,time:e}),this},t.TimelineState.prototype.getLastState=function(t,e){e=this.toSeconds(e);for(var i=this._search(e);i>=0;i--){var n=this._timeline[i];if(n.state===t)return n}},t.TimelineState.prototype.getNextState=function(t,e){e=this.toSeconds(e);var i=this._search(e);if(-1!==i)for(var n=i;n<this._timeline.length;n++){var o=this._timeline[n];if(o.state===t)return o}},t.TimelineState}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(66)],void 0===(o=function(t){if(t.supported){!t.global.hasOwnProperty("AudioContext")&&t.global.hasOwnProperty("webkitAudioContext")&&(t.global.AudioContext=t.global.webkitAudioContext),AudioContext.prototype.close||(AudioContext.prototype.close=function(){return t.isFunction(this.suspend)&&this.suspend(),Promise.resolve()}),AudioContext.prototype.resume||(AudioContext.prototype.resume=function(){var t=this.createBuffer(1,1,this.sampleRate),e=this.createBufferSource();return e.buffer=t,e.connect(this.destination),e.start(0),Promise.resolve()}),!AudioContext.prototype.createGain&&AudioContext.prototype.createGainNode&&(AudioContext.prototype.createGain=AudioContext.prototype.createGainNode),!AudioContext.prototype.createDelay&&AudioContext.prototype.createDelayNode&&(AudioContext.prototype.createDelay=AudioContext.prototype.createDelayNode);var e=!1,i=new OfflineAudioContext(1,1,44100),n=new Uint32Array([1179011410,48,1163280727,544501094,16,131073,44100,176400,1048580,1635017060,8,0,0,0,0]).buffer;try{var o=i.decodeAudioData(n);o&&t.isFunction(o.then)&&(e=!0)}catch(t){e=!1}e||(AudioContext.prototype._native_decodeAudioData=AudioContext.prototype.decodeAudioData,AudioContext.prototype.decodeAudioData=function(t){return new Promise(function(e,i){this._native_decodeAudioData(t,e,i)}.bind(this))})}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){"use strict";return t.Emitter=function(){t.call(this),this._events={}},t.extend(t.Emitter),t.Emitter.prototype.on=function(t,e){for(var i=t.split(/\W+/),n=0;n<i.length;n++){var o=i[n];this._events.hasOwnProperty(o)||(this._events[o]=[]),this._events[o].push(e)}return this},t.Emitter.prototype.once=function(t,e){var i=function(){e.apply(this,arguments),this.off(t,i)}.bind(this);return this.on(t,i),this},t.Emitter.prototype.off=function(e,i){for(var n=e.split(/\W+/),o=0;o<n.length;o++)if(e=n[o],this._events.hasOwnProperty(e))if(t.isUndef(i))this._events[e]=[];else for(var s=this._events[e],r=0;r<s.length;r++)s[r]===i&&s.splice(r,1);return this},t.Emitter.prototype.emit=function(t){if(this._events){var e=Array.apply(null,arguments).slice(1);if(this._events.hasOwnProperty(t))for(var i=this._events[t].slice(0),n=0,o=i.length;n<o;n++)i[n].apply(this,e)}return this},t.Emitter.mixin=function(e){var i=["on","once","off","emit"];e._events={};for(var n=0;n<i.length;n++){var o=i[n],s=t.Emitter.prototype[o];e[o]=s}return t.Emitter},t.Emitter.prototype.dispose=function(){return t.prototype.dispose.call(this),this._events=null,this},t.Emitter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(2)],void 0===(o=function(t){"use strict";return t.SignalBase=function(){t.AudioNode.call(this)},t.extend(t.SignalBase,t.AudioNode),t.SignalBase.prototype.connect=function(e,i,n){return t.Signal&&t.Signal===e.constructor||t.Param&&t.Param===e.constructor?(e._param.cancelScheduledValues(0),e._param.setValueAtTime(0,0),e.overridden=!0):e instanceof AudioParam&&(e.cancelScheduledValues(0),e.setValueAtTime(0,0)),t.AudioNode.prototype.connect.call(this,e,i,n),this},t.SignalBase}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(49),i(71),i(48),i(70),i(69)],void 0===(o=function(t){"use strict";t.OmniOscillator=function(){var e=t.defaults(arguments,["frequency","type"],t.OmniOscillator);t.Source.call(this,e),this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this._sourceType=void 0,this._oscillator=null,this.type=e.type,this._readOnly(["frequency","detune"]),this.set(e)},t.extend(t.OmniOscillator,t.Source),t.OmniOscillator.defaults={frequency:440,detune:0,type:"sine",phase:0};var e="PulseOscillator",i="PWMOscillator",n="Oscillator",o="FMOscillator",s="AMOscillator",r="FatOscillator";t.OmniOscillator.prototype._start=function(t){this._oscillator.start(t)},t.OmniOscillator.prototype._stop=function(t){this._oscillator.stop(t)},t.OmniOscillator.prototype.restart=function(t){this._oscillator.restart(t)},Object.defineProperty(t.OmniOscillator.prototype,"type",{get:function(){var t="";return this._sourceType===o?t="fm":this._sourceType===s?t="am":this._sourceType===r&&(t="fat"),t+this._oscillator.type},set:function(t){"fm"===t.substr(0,2)?(this._createNewOscillator(o),this._oscillator.type=t.substr(2)):"am"===t.substr(0,2)?(this._createNewOscillator(s),this._oscillator.type=t.substr(2)):"fat"===t.substr(0,3)?(this._createNewOscillator(r),this._oscillator.type=t.substr(3)):"pwm"===t?this._createNewOscillator(i):"pulse"===t?this._createNewOscillator(e):(this._createNewOscillator(n),this._oscillator.type=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"partials",{get:function(){return this._oscillator.partials},set:function(t){this._oscillator.partials=t}}),Object.defineProperty(t.OmniOscillator.prototype,"partialCount",{get:function(){return this._oscillator.partialCount},set:function(t){this._oscillator.partialCount=t}}),t.OmniOscillator.prototype.set=function(e,i){return"type"===e?this.type=i:t.isObject(e)&&e.hasOwnProperty("type")&&(this.type=e.type),t.prototype.set.apply(this,arguments),this},t.OmniOscillator.prototype.get=function(t){var e=this._oscillator.get(t);return e.type=this.type,e},t.OmniOscillator.prototype._createNewOscillator=function(e){if(e!==this._sourceType){this._sourceType=e;var i=t[e],n=this.now();if(null!==this._oscillator){var o=this._oscillator;o.stop(n),this.context.setTimeout(function(){o.dispose(),o=null},this.blockTime)}this._oscillator=new i,this.frequency.connect(this._oscillator.frequency),this.detune.connect(this._oscillator.detune),this._oscillator.connect(this.output),this.state===t.State.Started&&this._oscillator.start(n)}},Object.defineProperty(t.OmniOscillator.prototype,"phase",{get:function(){return this._oscillator.phase},set:function(t){this._oscillator.phase=t}});var a={PulseOscillator:"pulse",PWMOscillator:"pwm",Oscillator:"oscillator",FMOscillator:"fm",AMOscillator:"am",FatOscillator:"fat"};return Object.defineProperty(t.OmniOscillator.prototype,"sourceType",{get:function(){return a[this._sourceType]},set:function(t){var e="sine";"pwm"!==this._oscillator.type&&"pulse"!==this._oscillator.type&&(e=this._oscillator.type),t===a.FMOscillator?this.type="fm"+e:t===a.AMOscillator?this.type="am"+e:t===a.FatOscillator?this.type="fat"+e:t===a.Oscillator?this.type=e:t===a.PulseOscillator?this.type="pulse":t===a.PWMOscillator&&(this.type="pwm")}}),Object.defineProperty(t.OmniOscillator.prototype,"baseType",{get:function(){return this._oscillator.baseType},set:function(t){this.sourceType!==a.PulseOscillator&&this.sourceType!==a.PWMOscillator&&(this._oscillator.baseType=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"width",{get:function(){if(this._sourceType===e)return this._oscillator.width}}),Object.defineProperty(t.OmniOscillator.prototype,"count",{get:function(){if(this._sourceType===r)return this._oscillator.count},set:function(t){this._sourceType===r&&(this._oscillator.count=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"spread",{get:function(){if(this._sourceType===r)return this._oscillator.spread},set:function(t){this._sourceType===r&&(this._oscillator.spread=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"modulationType",{get:function(){if(this._sourceType===o||this._sourceType===s)return this._oscillator.modulationType},set:function(t){this._sourceType!==o&&this._sourceType!==s||(this._oscillator.modulationType=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"modulationIndex",{get:function(){if(this._sourceType===o)return this._oscillator.modulationIndex}}),Object.defineProperty(t.OmniOscillator.prototype,"harmonicity",{get:function(){if(this._sourceType===o||this._sourceType===s)return this._oscillator.harmonicity}}),Object.defineProperty(t.OmniOscillator.prototype,"modulationFrequency",{get:function(){if(this._sourceType===i)return this._oscillator.modulationFrequency}}),t.OmniOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._writable(["frequency","detune"]),this.detune.dispose(),this.detune=null,this.frequency.dispose(),this.frequency=null,this._oscillator.dispose(),this._oscillator=null,this._sourceType=null,this},t.OmniOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(30),i(37),i(1),i(25)],void 0===(o=function(t){"use strict";return t.Synth=function(e){e=t.defaultArg(e,t.Synth.defaults),t.Monophonic.call(this,e),this.oscillator=new t.OmniOscillator(e.oscillator),this.frequency=this.oscillator.frequency,this.detune=this.oscillator.detune,this.envelope=new t.AmplitudeEnvelope(e.envelope),this.oscillator.chain(this.envelope,this.output),this._readOnly(["oscillator","frequency","detune","envelope"])},t.extend(t.Synth,t.Monophonic),t.Synth.defaults={oscillator:{type:"triangle"},envelope:{attack:.005,decay:.1,sustain:.3,release:1}},t.Synth.prototype._triggerEnvelopeAttack=function(t,e){return this.envelope.triggerAttack(t,e),this.oscillator.start(t),0===this.envelope.sustain&&this.oscillator.stop(t+this.envelope.attack+this.envelope.decay),this},t.Synth.prototype._triggerEnvelopeRelease=function(t){return t=this.toSeconds(t),this.envelope.triggerRelease(t),this.oscillator.stop(t+this.envelope.release),this},t.Synth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["oscillator","frequency","detune","envelope"]),this.oscillator.dispose(),this.oscillator=null,this.envelope.dispose(),this.envelope=null,this.frequency=null,this.detune=null,this},t.Synth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(11),i(31)],void 0===(o=function(t){"use strict";t.Noise=function(){var e=t.defaults(arguments,["type"],t.Noise);t.Source.call(this,e),this._source=null,this._type=e.type,this._playbackRate=e.playbackRate},t.extend(t.Noise,t.Source),t.Noise.defaults={type:"white",playbackRate:1},Object.defineProperty(t.Noise.prototype,"type",{get:function(){return this._type},set:function(i){if(this._type!==i){if(!(i in e))throw new TypeError("Tone.Noise: invalid type: "+i);if(this._type=i,this.state===t.State.Started){var n=this.now();this._stop(n),this._start(n)}}}}),Object.defineProperty(t.Noise.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(t){this._playbackRate=t,this._source&&(this._source.playbackRate.value=t)}}),t.Noise.prototype._start=function(i){var n=e[this._type];this._source=new t.BufferSource(n).connect(this.output),this._source.loop=!0,this._source.playbackRate.value=this._playbackRate,this._source.start(this.toSeconds(i),Math.random()*(n.duration-.001))},t.Noise.prototype._stop=function(t){this._source&&(this._source.stop(this.toSeconds(t)),this._source=null)},t.Noise.prototype.restart=function(t){return this._stop(t),this._start(t),this},t.Noise.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),null!==this._source&&(this._source.disconnect(),this._source=null),this._buffer=null,this};var e={},i={};return Object.defineProperty(e,"pink",{get:function(){if(!i.pink){for(var e=[],n=0;n<2;n++){var o,s,r,a,l,h,u,c=new Float32Array(220500);e[n]=c,o=s=r=a=l=h=u=0;for(var p=0;p<220500;p++){var f=2*Math.random()-1;o=.99886*o+.0555179*f,s=.99332*s+.0750759*f,r=.969*r+.153852*f,a=.8665*a+.3104856*f,l=.55*l+.5329522*f,h=-.7616*h-.016898*f,c[p]=o+s+r+a+l+h+u+.5362*f,c[p]*=.11,u=.115926*f}}i.pink=(new t.Buffer).fromArray(e)}return i.pink}}),Object.defineProperty(e,"brown",{get:function(){if(!i.brown){for(var e=[],n=0;n<2;n++){var o=new Float32Array(220500);e[n]=o;for(var s=0,r=0;r<220500;r++){var a=2*Math.random()-1;o[r]=(s+.02*a)/1.02,s=o[r],o[r]*=3.5}}i.brown=(new t.Buffer).fromArray(e)}return i.brown}}),Object.defineProperty(e,"white",{get:function(){if(!i.white){for(var e=[],n=0;n<2;n++){var o=new Float32Array(220500);e[n]=o;for(var s=0;s<220500;s++)o[s]=2*Math.random()-1}i.white=(new t.Buffer).fromArray(e)}return i.white}}),t.Noise}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(27),i(20),i(2)],void 0===(o=function(t){"use strict";t.Master=function(){t.AudioNode.call(this),t.getContext(function(){this.createInsOuts(1,0),this._volume=this.output=new t.Volume,this.volume=this._volume.volume,this._readOnly("volume"),this.input.chain(this.output,this.context.destination),this.context.master=this}.bind(this))},t.extend(t.Master,t.AudioNode),t.Master.defaults={volume:0,mute:!1},t.Master.prototype.isMaster=!0,Object.defineProperty(t.Master.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),t.Master.prototype.chain=function(){this.input.disconnect(),this.input.chain.apply(this.input,arguments),arguments[arguments.length-1].connect(this.output)},t.Master.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._writable("volume"),this._volume.dispose(),this._volume=null,this.volume=null},t.AudioNode.prototype.toMaster=function(){return this.connect(this.context.master),this};var e=t.Master;return t.Master=new e,t.Context.on("init",function(i){i.master&&i.master.isMaster?t.Master=i.master:t.Master=new e}),t.Context.on("close",function(t){t.master&&t.master.isMaster&&t.master.dispose()}),t.Master}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(89),i(47)],void 0===(o=function(t){"use strict";return t.FrequencyEnvelope=function(){var e=t.defaults(arguments,["attack","decay","sustain","release"],t.Envelope);e=t.defaultArg(e,t.FrequencyEnvelope.defaults),t.ScaledEnvelope.call(this,e),this._octaves=e.octaves,this.baseFrequency=e.baseFrequency,this.octaves=e.octaves,this.exponent=e.exponent},t.extend(t.FrequencyEnvelope,t.Envelope),t.FrequencyEnvelope.defaults={baseFrequency:200,octaves:4,exponent:1},Object.defineProperty(t.FrequencyEnvelope.prototype,"baseFrequency",{get:function(){return this._scale.min},set:function(t){this._scale.min=this.toFrequency(t),this.octaves=this._octaves}}),Object.defineProperty(t.FrequencyEnvelope.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t,this._scale.max=this.baseFrequency*Math.pow(2,t)}}),Object.defineProperty(t.FrequencyEnvelope.prototype,"exponent",{get:function(){return this._exp.value},set:function(t){this._exp.value=t}}),t.FrequencyEnvelope.prototype.dispose=function(){return t.ScaledEnvelope.prototype.dispose.call(this),this},t.FrequencyEnvelope}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(26),i(61)],void 0===(o=function(t){return t.ScaleExp=function(e,i,n){t.SignalBase.call(this),this._scale=this.output=new t.Scale(e,i),this._exp=this.input=new t.Pow(t.defaultArg(n,2)),this._exp.connect(this._scale)},t.extend(t.ScaleExp,t.SignalBase),Object.defineProperty(t.ScaleExp.prototype,"exponent",{get:function(){return this._exp.value},set:function(t){this._exp.value=t}}),Object.defineProperty(t.ScaleExp.prototype,"min",{get:function(){return this._scale.min},set:function(t){this._scale.min=t}}),Object.defineProperty(t.ScaleExp.prototype,"max",{get:function(){return this._scale.max},set:function(t){this._scale.max=t}}),t.ScaleExp.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._scale.dispose(),this._scale=null,this._exp.dispose(),this._exp=null,this},t.ScaleExp}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(14),i(2)],void 0===(o=function(t){"use strict";return t.Compressor=function(){var e=t.defaults(arguments,["threshold","ratio"],t.Compressor);t.AudioNode.call(this),this._compressor=this.input=this.output=this.context.createDynamicsCompressor(),this.threshold=new t.Param({param:this._compressor.threshold,units:t.Type.Decibels,convert:!1}),this.attack=new t.Param(this._compressor.attack,t.Type.Time),this.release=new t.Param(this._compressor.release,t.Type.Time),this.knee=new t.Param({param:this._compressor.knee,units:t.Type.Decibels,convert:!1}),this.ratio=new t.Param({param:this._compressor.ratio,convert:!1}),this._readOnly(["knee","release","attack","ratio","threshold"]),this.set(e)},t.extend(t.Compressor,t.AudioNode),t.Compressor.defaults={ratio:12,threshold:-24,release:.25,attack:.003,knee:30},t.Compressor.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["knee","release","attack","ratio","threshold"]),this._compressor.disconnect(),this._compressor=null,this.attack.dispose(),this.attack=null,this.release.dispose(),this.release=null,this.threshold.dispose(),this.threshold=null,this.ratio.dispose(),this.ratio=null,this.knee.dispose(),this.knee=null,this},t.Compressor}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(2),i(96)],void 0===(o=function(t){"use strict";return t.Analyser=function(){var e=t.defaults(arguments,["type","size"],t.Analyser);t.AudioNode.call(this),this._analyser=this.input=this.output=this.context.createAnalyser(),this._type=e.type,this._buffer=null,this.size=e.size,this.type=e.type},t.extend(t.Analyser,t.AudioNode),t.Analyser.defaults={size:1024,type:"fft",smoothing:.8},t.Analyser.Type={Waveform:"waveform",FFT:"fft"},t.Analyser.prototype.getValue=function(){return this._type===t.Analyser.Type.FFT?this._analyser.getFloatFrequencyData(this._buffer):this._type===t.Analyser.Type.Waveform&&this._analyser.getFloatTimeDomainData(this._buffer),this._buffer},Object.defineProperty(t.Analyser.prototype,"size",{get:function(){return this._analyser.frequencyBinCount},set:function(t){this._analyser.fftSize=2*t,this._buffer=new Float32Array(t)}}),Object.defineProperty(t.Analyser.prototype,"type",{get:function(){return this._type},set:function(e){if(e!==t.Analyser.Type.Waveform&&e!==t.Analyser.Type.FFT)throw new TypeError("Tone.Analyser: invalid type: "+e);this._type=e}}),Object.defineProperty(t.Analyser.prototype,"smoothing",{get:function(){return this._analyser.smoothingTimeConstant},set:function(t){this._analyser.smoothingTimeConstant=t}}),t.Analyser.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._analyser.disconnect(),this._analyser=null,this._buffer=null},t.Analyser}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(65)],void 0===(o=function(t){return t.TransportTime=function(e,i){if(!(this instanceof t.TransportTime))return new t.TransportTime(e,i);t.Time.call(this,e,i)},t.extend(t.TransportTime,t.Time),t.TransportTime.prototype._now=function(){return t.Transport.seconds},t.TransportTime}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(64)],void 0===(o=function(t){t.Frequency=function(e,i){if(!(this instanceof t.Frequency))return new t.Frequency(e,i);t.TimeBase.call(this,e,i)},t.extend(t.Frequency,t.TimeBase),t.Frequency.prototype._expressions=Object.assign({},t.TimeBase.prototype._expressions,{midi:{regexp:/^(\d+(?:\.\d+)?midi)/,method:function(e){return"midi"===this._defaultUnits?e:t.Frequency.mtof(e)}},note:{regexp:/^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i,method:function(i,n){var o=e[i.toLowerCase()]+12*(parseInt(n)+1);return"midi"===this._defaultUnits?o:t.Frequency.mtof(o)}},tr:{regexp:/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?/,method:function(t,e,i){var n=1;return t&&"0"!==t&&(n*=this._beatsToUnits(this._getTimeSignature()*parseFloat(t))),e&&"0"!==e&&(n*=this._beatsToUnits(parseFloat(e))),i&&"0"!==i&&(n*=this._beatsToUnits(parseFloat(i)/4)),n}}}),t.Frequency.prototype.transpose=function(e){return new this.constructor(this.valueOf()*t.intervalToFrequencyRatio(e))},t.Frequency.prototype.harmonize=function(t){return t.map(function(t){return this.transpose(t)}.bind(this))},t.Frequency.prototype.toMidi=function(){return t.Frequency.ftom(this.valueOf())},t.Frequency.prototype.toNote=function(){var e=this.toFrequency(),n=Math.log2(e/t.Frequency.A4),o=Math.round(12*n)+57,s=Math.floor(o/12);return s<0&&(o+=-12*s),i[o%12]+s.toString()},t.Frequency.prototype.toSeconds=function(){return 1/t.TimeBase.prototype.toSeconds.call(this)},t.Frequency.prototype.toFrequency=function(){return t.TimeBase.prototype.toFrequency.call(this)},t.Frequency.prototype.toTicks=function(){var e=this._beatsToUnits(1),i=this.valueOf()/e;return Math.floor(i*t.Transport.PPQ)},t.Frequency.prototype._noArg=function(){return 0},t.Frequency.prototype._frequencyToUnits=function(t){return t},t.Frequency.prototype._ticksToUnits=function(e){return 1/(60*e/(t.Transport.bpm.value*t.Transport.PPQ))},t.Frequency.prototype._beatsToUnits=function(e){return 1/t.TimeBase.prototype._beatsToUnits.call(this,e)},t.Frequency.prototype._secondsToUnits=function(t){return 1/t},t.Frequency.prototype._defaultUnits="hz";var e={cbb:-2,cb:-1,c:0,"c#":1,cx:2,dbb:0,db:1,d:2,"d#":3,dx:4,ebb:2,eb:3,e:4,"e#":5,ex:6,fbb:3,fb:4,f:5,"f#":6,fx:7,gbb:5,gb:6,g:7,"g#":8,gx:9,abb:7,ab:8,a:9,"a#":10,ax:11,bbb:9,bb:10,b:11,"b#":12,bx:13},i=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];return t.Frequency.A4=440,t.Frequency.mtof=function(e){return t.Frequency.A4*Math.pow(2,(e-69)/12)},t.Frequency.ftom=function(e){return 69+Math.round(12*Math.log2(e/t.Frequency.A4))},t.Frequency}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(61),i(4),i(2)],void 0===(o=function(t){"use strict";return t.Envelope=function(){var e=t.defaults(arguments,["attack","decay","sustain","release"],t.Envelope);t.AudioNode.call(this),this.attack=e.attack,this.decay=e.decay,this.sustain=e.sustain,this.release=e.release,this._attackCurve="linear",this._releaseCurve="exponential",this._sig=this.output=new t.Signal(0),this.attackCurve=e.attackCurve,this.releaseCurve=e.releaseCurve,this.decayCurve=e.decayCurve},t.extend(t.Envelope,t.AudioNode),t.Envelope.defaults={attack:.01,decay:.1,sustain:.5,release:1,attackCurve:"linear",decayCurve:"exponential",releaseCurve:"exponential"},Object.defineProperty(t.Envelope.prototype,"value",{get:function(){return this.getValueAtTime(this.now())}}),t.Envelope.prototype._getCurve=function(e,i){if(t.isString(e))return e;if(t.isArray(e)){for(var n in t.Envelope.Type)if(t.Envelope.Type[n][i]===e)return n;return e}},t.Envelope.prototype._setCurve=function(e,i,n){if(t.Envelope.Type.hasOwnProperty(n)){var o=t.Envelope.Type[n];t.isObject(o)?this[e]=o[i]:this[e]=o}else{if(!t.isArray(n))throw new Error("Tone.Envelope: invalid curve: "+n);this[e]=n}},Object.defineProperty(t.Envelope.prototype,"attackCurve",{get:function(){return this._getCurve(this._attackCurve,"In")},set:function(t){this._setCurve("_attackCurve","In",t)}}),Object.defineProperty(t.Envelope.prototype,"releaseCurve",{get:function(){return this._getCurve(this._releaseCurve,"Out")},set:function(t){this._setCurve("_releaseCurve","Out",t)}}),Object.defineProperty(t.Envelope.prototype,"decayCurve",{get:function(){return this._decayCurve},set:function(t){if(!["linear","exponential"].includes(t))throw new Error("Tone.Envelope: invalid curve: "+t);this._decayCurve=t}}),t.Envelope.prototype.triggerAttack=function(e,i){this.log("triggerAttack",e,i),e=this.toSeconds(e);var n=this.toSeconds(this.attack),o=this.toSeconds(this.decay);i=t.defaultArg(i,1);var s=this.getValueAtTime(e);s>0&&(n=(1-s)/(1/n));if("linear"===this._attackCurve)this._sig.linearRampTo(i,n,e);else if("exponential"===this._attackCurve)this._sig.targetRampTo(i,n,e);else if(n>0){this._sig.cancelAndHoldAtTime(e);for(var r=this._attackCurve,a=1;a<r.length;a++)if(r[a-1]<=s&&s<=r[a]){(r=this._attackCurve.slice(a))[0]=s;break}this._sig.setValueCurveAtTime(r,e,n,i)}if(o){var l=i*this.sustain,h=e+n;this.log("decay",h),"linear"===this._decayCurve?this._sig.linearRampTo(l,o,h+this.sampleTime):"exponential"===this._decayCurve&&this._sig.exponentialApproachValueAtTime(l,h,o)}return this},t.Envelope.prototype.triggerRelease=function(e){this.log("triggerRelease",e),e=this.toSeconds(e);var i=this.getValueAtTime(e);if(i>0){var n=this.toSeconds(this.release);if("linear"===this._releaseCurve)this._sig.linearRampTo(0,n,e);else if("exponential"===this._releaseCurve)this._sig.targetRampTo(0,n,e);else{var o=this._releaseCurve;t.isArray(o)&&(this._sig.cancelAndHoldAtTime(e),this._sig.setValueCurveAtTime(o,e,n,i))}}return this},t.Envelope.prototype.getValueAtTime=function(t){return this._sig.getValueAtTime(t)},t.Envelope.prototype.triggerAttackRelease=function(t,e,i){return e=this.toSeconds(e),this.triggerAttack(e,i),this.triggerRelease(e+this.toSeconds(t)),this},t.Envelope.prototype.cancel=function(t){return this._sig.cancelScheduledValues(t),this},t.Envelope.prototype.connect=t.SignalBase.prototype.connect,function(){var e,i,n=[];for(e=0;e<128;e++)n[e]=Math.sin(e/127*(Math.PI/2));var o=[];for(e=0;e<127;e++){i=e/127;var s=Math.sin(i*(2*Math.PI)*6.4-Math.PI/2)+1;o[e]=s/10+.83*i}o[127]=1;var r=[];for(e=0;e<128;e++)r[e]=Math.ceil(e/127*5)/5;var a=[];for(e=0;e<128;e++)i=e/127,a[e]=.5*(1-Math.cos(Math.PI*i));var l,h=[];for(e=0;e<128;e++){i=e/127;var u=4*Math.pow(i,3)+.2,c=Math.cos(u*Math.PI*2*i);h[e]=Math.abs(c*(1-i))}function p(t){for(var e=new Array(t.length),i=0;i<t.length;i++)e[i]=1-t[i];return e}t.Envelope.Type={linear:"linear",exponential:"exponential",bounce:{In:p(h),Out:h},cosine:{In:n,Out:(l=n,l.slice(0).reverse())},step:{In:r,Out:p(r)},ripple:{In:o,Out:p(o)},sine:{In:a,Out:p(a)}}}(),t.Envelope.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._sig.dispose(),this._sig=null,this._attackCurve=null,this._releaseCurve=null,this},t.Envelope}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(5),i(3)],void 0===(o=function(t){"use strict";return t.FMOscillator=function(){var e=t.defaults(arguments,["frequency","type","modulationType"],t.FMOscillator);t.Source.call(this,e),this._carrier=new t.Oscillator(e.frequency,e.type),this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=this._carrier.detune,this.detune.value=e.detune,this.modulationIndex=new t.Multiply(e.modulationIndex),this.modulationIndex.units=t.Type.Positive,this._modulator=new t.Oscillator(e.frequency,e.modulationType),this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this._modulationNode=new t.Gain(0),this.frequency.connect(this._carrier.frequency),this.frequency.chain(this.harmonicity,this._modulator.frequency),this.frequency.chain(this.modulationIndex,this._modulationNode),this._modulator.connect(this._modulationNode.gain),this._modulationNode.connect(this._carrier.frequency),this._carrier.connect(this.output),this.detune.connect(this._modulator.detune),this.phase=e.phase,this._readOnly(["modulationIndex","frequency","detune","harmonicity"])},t.extend(t.FMOscillator,t.Source),t.FMOscillator.defaults={frequency:440,detune:0,phase:0,type:"sine",modulationIndex:2,modulationType:"square",harmonicity:1},t.FMOscillator.prototype._start=function(t){this._modulator.start(t),this._carrier.start(t)},t.FMOscillator.prototype._stop=function(t){this._modulator.stop(t),this._carrier.stop(t)},t.FMOscillator.prototype.restart=function(t){this._modulator.restart(t),this._carrier.restart(t)},Object.defineProperty(t.FMOscillator.prototype,"type",{get:function(){return this._carrier.type},set:function(t){this._carrier.type=t}}),Object.defineProperty(t.FMOscillator.prototype,"baseType",{get:function(){return this._carrier.baseType},set:function(t){this._carrier.baseType=t}}),Object.defineProperty(t.FMOscillator.prototype,"partialCount",{get:function(){return this._carrier.partialCount},set:function(t){this._carrier.partialCount=t}}),Object.defineProperty(t.FMOscillator.prototype,"modulationType",{get:function(){return this._modulator.type},set:function(t){this._modulator.type=t}}),Object.defineProperty(t.FMOscillator.prototype,"phase",{get:function(){return this._carrier.phase},set:function(t){this._carrier.phase=t,this._modulator.phase=t}}),Object.defineProperty(t.FMOscillator.prototype,"partials",{get:function(){return this._carrier.partials},set:function(t){this._carrier.partials=t}}),t.FMOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._writable(["modulationIndex","frequency","detune","harmonicity"]),this.frequency.dispose(),this.frequency=null,this.detune=null,this.harmonicity.dispose(),this.harmonicity=null,this._carrier.dispose(),this._carrier=null,this._modulator.dispose(),this._modulator=null,this._modulationNode.dispose(),this._modulationNode=null,this.modulationIndex.dispose(),this.modulationIndex=null,this},t.FMOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(1),i(7),i(3)],void 0===(o=function(t){"use strict";return t.PulseOscillator=function(){var e=t.defaults(arguments,["frequency","width"],t.Oscillator);t.Source.call(this,e),this.width=new t.Signal(e.width,t.Type.NormalRange),this._widthGate=new t.Gain(0),this._sawtooth=new t.Oscillator({frequency:e.frequency,detune:e.detune,type:"sawtooth",phase:e.phase}),this.frequency=this._sawtooth.frequency,this.detune=this._sawtooth.detune,this._thresh=new t.WaveShaper(function(t){return t<0?-1:1}),this._sawtooth.chain(this._thresh,this.output),this.width.chain(this._widthGate,this._thresh),this._readOnly(["width","frequency","detune"])},t.extend(t.PulseOscillator,t.Source),t.PulseOscillator.defaults={frequency:440,detune:0,phase:0,width:.2},t.PulseOscillator.prototype._start=function(t){t=this.toSeconds(t),this._sawtooth.start(t),this._widthGate.gain.setValueAtTime(1,t)},t.PulseOscillator.prototype._stop=function(t){t=this.toSeconds(t),this._sawtooth.stop(t),this._widthGate.gain.setValueAtTime(0,t)},t.PulseOscillator.prototype.restart=function(t){this._sawtooth.restart(t),this._widthGate.gain.cancelScheduledValues(t),this._widthGate.gain.setValueAtTime(1,t)},Object.defineProperty(t.PulseOscillator.prototype,"phase",{get:function(){return this._sawtooth.phase},set:function(t){this._sawtooth.phase=t}}),Object.defineProperty(t.PulseOscillator.prototype,"type",{get:function(){return"pulse"}}),Object.defineProperty(t.PulseOscillator.prototype,"baseType",{get:function(){return"pulse"}}),Object.defineProperty(t.PulseOscillator.prototype,"partials",{get:function(){return[]}}),t.PulseOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._sawtooth.dispose(),this._sawtooth=null,this._writable(["width","frequency","detune"]),this.width.dispose(),this.width=null,this._widthGate.dispose(),this._widthGate=null,this._thresh.dispose(),this._thresh=null,this.frequency=null,this.detune=null,this},t.PulseOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(16),i(4),i(33)],void 0===(o=function(t){"use strict";return t.Event=function(){var e=t.defaults(arguments,["callback","value"],t.Event);t.call(this),this._loop=e.loop,this.callback=e.callback,this.value=e.value,this._loopStart=this.toTicks(e.loopStart),this._loopEnd=this.toTicks(e.loopEnd),this._state=new t.TimelineState(t.State.Stopped),this._playbackRate=1,this._startOffset=0,this._probability=e.probability,this._humanize=e.humanize,this.mute=e.mute,this.playbackRate=e.playbackRate},t.extend(t.Event),t.Event.defaults={callback:t.noOp,loop:!1,loopEnd:"1m",loopStart:0,playbackRate:1,value:null,probability:1,mute:!1,humanize:!1},t.Event.prototype._rescheduleEvents=function(e){return e=t.defaultArg(e,-1),this._state.forEachFrom(e,function(e){var i;if(e.state===t.State.Started){t.isDefined(e.id)&&t.Transport.clear(e.id);var n=e.time+Math.round(this.startOffset/this._playbackRate);if(this._loop){i=1/0,t.isNumber(this._loop)&&(i=this._loop*this._getLoopDuration());var o=this._state.getAfter(n);null!==o&&(i=Math.min(i,o.time-n)),i!==1/0&&(this._state.setStateAtTime(t.State.Stopped,n+i+1),i=t.Ticks(i));var s=t.Ticks(this._getLoopDuration());e.id=t.Transport.scheduleRepeat(this._tick.bind(this),s,t.Ticks(n),i)}else e.id=t.Transport.schedule(this._tick.bind(this),t.Ticks(n))}}.bind(this)),this},Object.defineProperty(t.Event.prototype,"state",{get:function(){return this._state.getValueAtTime(t.Transport.ticks)}}),Object.defineProperty(t.Event.prototype,"startOffset",{get:function(){return this._startOffset},set:function(t){this._startOffset=t}}),Object.defineProperty(t.Event.prototype,"probability",{get:function(){return this._probability},set:function(t){this._probability=t}}),Object.defineProperty(t.Event.prototype,"humanize",{get:function(){return this._humanize},set:function(t){this._humanize=t}}),t.Event.prototype.start=function(e){return e=this.toTicks(e),this._state.getValueAtTime(e)===t.State.Stopped&&(this._state.add({state:t.State.Started,time:e,id:void 0}),this._rescheduleEvents(e)),this},t.Event.prototype.stop=function(e){if(this.cancel(e),e=this.toTicks(e),this._state.getValueAtTime(e)===t.State.Started){this._state.setStateAtTime(t.State.Stopped,e);var i=this._state.getBefore(e),n=e;null!==i&&(n=i.time),this._rescheduleEvents(n)}return this},t.Event.prototype.cancel=function(e){return e=t.defaultArg(e,-1/0),e=this.toTicks(e),this._state.forEachFrom(e,function(e){t.Transport.clear(e.id)}),this._state.cancel(e),this},t.Event.prototype._tick=function(e){var i=t.Transport.getTicksAtTime(e);if(!this.mute&&this._state.getValueAtTime(i)===t.State.Started){if(this.probability<1&&Math.random()>this.probability)return;if(this.humanize){var n=.02;t.isBoolean(this.humanize)||(n=this.toSeconds(this.humanize)),e+=(2*Math.random()-1)*n}this.callback(e,this.value)}},t.Event.prototype._getLoopDuration=function(){return Math.round((this._loopEnd-this._loopStart)/this._playbackRate)},Object.defineProperty(t.Event.prototype,"loop",{get:function(){return this._loop},set:function(t){this._loop=t,this._rescheduleEvents()}}),Object.defineProperty(t.Event.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(t){this._playbackRate=t,this._rescheduleEvents()}}),Object.defineProperty(t.Event.prototype,"loopEnd",{get:function(){return t.Ticks(this._loopEnd).toSeconds()},set:function(t){this._loopEnd=this.toTicks(t),this._loop&&this._rescheduleEvents()}}),Object.defineProperty(t.Event.prototype,"loopStart",{get:function(){return t.Ticks(this._loopStart).toSeconds()},set:function(t){this._loopStart=this.toTicks(t),this._loop&&this._rescheduleEvents()}}),Object.defineProperty(t.Event.prototype,"progress",{get:function(){if(this._loop){var e=t.Transport.ticks,i=this._state.get(e);if(null!==i&&i.state===t.State.Started){var n=this._getLoopDuration();return(e-i.time)%n/n}return 0}return 0}}),t.Event.prototype.dispose=function(){this.cancel(),this._state.dispose(),this._state=null,this.callback=null,this.value=null},t.Event}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(13),i(29),i(10),i(3),i(2)],void 0===(o=function(t){"use strict";return t.MidSideMerge=function(){t.AudioNode.call(this),this.createInsOuts(2,0),this.mid=this.input[0]=new t.Gain,this._left=new t.Add,this._timesTwoLeft=new t.Multiply(Math.SQRT1_2),this.side=this.input[1]=new t.Gain,this._right=new t.Subtract,this._timesTwoRight=new t.Multiply(Math.SQRT1_2),this._merge=this.output=new t.Merge,this.mid.connect(this._left,0,0),this.side.connect(this._left,0,1),this.mid.connect(this._right,0,0),this.side.connect(this._right,0,1),this._left.connect(this._timesTwoLeft),this._right.connect(this._timesTwoRight),this._timesTwoLeft.connect(this._merge,0,0),this._timesTwoRight.connect(this._merge,0,1)},t.extend(t.MidSideMerge,t.AudioNode),t.MidSideMerge.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.mid.dispose(),this.mid=null,this.side.dispose(),this.side=null,this._left.dispose(),this._left=null,this._timesTwoLeft.dispose(),this._timesTwoLeft=null,this._right.dispose(),this._right=null,this._timesTwoRight.dispose(),this._timesTwoRight=null,this._merge.dispose(),this._merge=null,this},t.MidSideMerge}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(29),i(13),i(1),i(19),i(2)],void 0===(o=function(t){"use strict";return t.MidSideSplit=function(){t.AudioNode.call(this),this.createInsOuts(0,2),this._split=this.input=new t.Split,this._midAdd=new t.Add,this.mid=this.output[0]=new t.Multiply(Math.SQRT1_2),this._sideSubtract=new t.Subtract,this.side=this.output[1]=new t.Multiply(Math.SQRT1_2),this._split.connect(this._midAdd,0,0),this._split.connect(this._midAdd,1,1),this._split.connect(this._sideSubtract,0,0),this._split.connect(this._sideSubtract,1,1),this._midAdd.connect(this.mid),this._sideSubtract.connect(this.side)},t.extend(t.MidSideSplit,t.AudioNode),t.MidSideSplit.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.mid.dispose(),this.mid=null,this.side.dispose(),this.side=null,this._midAdd.dispose(),this._midAdd=null,this._sideSubtract.dispose(),this._sideSubtract=null,this._split.dispose(),this._split=null,this},t.MidSideSplit}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(9),i(2),i(58)],void 0===(o=function(t){"use strict";return t.LowpassCombFilter=function(){var e=t.defaults(arguments,["delayTime","resonance","dampening"],t.LowpassCombFilter);t.AudioNode.call(this),this._combFilter=this.output=new t.FeedbackCombFilter(e.delayTime,e.resonance),this.delayTime=this._combFilter.delayTime,this._lowpass=this.input=new t.Filter({frequency:e.dampening,type:"lowpass",Q:0,rolloff:-12}),this.dampening=this._lowpass.frequency,this.resonance=this._combFilter.resonance,this._lowpass.connect(this._combFilter),this._readOnly(["dampening","resonance","delayTime"])},t.extend(t.LowpassCombFilter,t.AudioNode),t.LowpassCombFilter.defaults={delayTime:.1,resonance:.5,dampening:3e3},t.LowpassCombFilter.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["dampening","resonance","delayTime"]),this._combFilter.dispose(),this._combFilter=null,this.resonance=null,this.delayTime=null,this._lowpass.dispose(),this._lowpass=null,this.dampening=null,this},t.LowpassCombFilter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(45)],void 0===(o=function(t){return t.Ticks=function(e,i){if(!(this instanceof t.Ticks))return new t.Ticks(e,i);t.TransportTime.call(this,e,i)},t.extend(t.Ticks,t.TransportTime),t.Ticks.prototype._defaultUnits="i",t.Ticks.prototype._now=function(){return t.Transport.ticks},t.Ticks.prototype._beatsToUnits=function(t){return this._getPPQ()*t},t.Ticks.prototype._secondsToUnits=function(t){return Math.floor(t/(60/this._getBpm())*this._getPPQ())},t.Ticks.prototype._ticksToUnits=function(t){return t},t.Ticks.prototype.toTicks=function(){return this.valueOf()},t.Ticks.prototype.toSeconds=function(){return this.valueOf()/this._getPPQ()*(60/this._getBpm())},t.Ticks}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(54)],void 0===(o=function(t){return t.TransportEvent=function(e,i){i=t.defaultArg(i,t.TransportEvent.defaults),t.call(this),this.Transport=e,this.id=t.TransportEvent._eventId++,this.time=t.Ticks(i.time),this.callback=i.callback,this._once=i.once},t.extend(t.TransportEvent),t.TransportEvent.defaults={once:!1,callback:t.noOp},t.TransportEvent._eventId=0,t.TransportEvent.prototype.invoke=function(t){this.callback&&(this.callback(t),this._once&&this.Transport&&this.Transport.clear(this.id))},t.TransportEvent.prototype.dispose=function(){return t.prototype.dispose.call(this),this.Transport=null,this.callback=null,this.time=null,this},t.TransportEvent}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(85),i(33),i(24),i(14)],void 0===(o=function(t){"use strict";return t.TickSource=function(){var e=t.defaults(arguments,["frequency"],t.TickSource);this.frequency=new t.TickSignal(e.frequency),this._readOnly("frequency"),this._state=new t.TimelineState(t.State.Stopped),this._state.setStateAtTime(t.State.Stopped,0),this._tickOffset=new t.Timeline,this.setTicksAtTime(0,0)},t.extend(t.TickSource),t.TickSource.defaults={frequency:1},Object.defineProperty(t.TickSource.prototype,"state",{get:function(){return this._state.getValueAtTime(this.now())}}),t.TickSource.prototype.start=function(e,i){return e=this.toSeconds(e),this._state.getValueAtTime(e)!==t.State.Started&&(this._state.setStateAtTime(t.State.Started,e),t.isDefined(i)&&this.setTicksAtTime(i,e)),this},t.TickSource.prototype.stop=function(e){if(e=this.toSeconds(e),this._state.getValueAtTime(e)===t.State.Stopped){var i=this._state.get(e);i.time>0&&(this._tickOffset.cancel(i.time),this._state.cancel(i.time))}return this._state.cancel(e),this._state.setStateAtTime(t.State.Stopped,e),this.setTicksAtTime(0,e),this},t.TickSource.prototype.pause=function(e){return e=this.toSeconds(e),this._state.getValueAtTime(e)===t.State.Started&&this._state.setStateAtTime(t.State.Paused,e),this},t.TickSource.prototype.cancel=function(t){return t=this.toSeconds(t),this._state.cancel(t),this._tickOffset.cancel(t),this},t.TickSource.prototype.getTicksAtTime=function(e){e=this.toSeconds(e);var i=this._state.getLastState(t.State.Stopped,e),n={state:t.State.Paused,time:e};this._state.add(n);var o=i,s=0;return this._state.forEachBetween(i.time,e+this.sampleTime,function(e){var i=o.time,n=this._tickOffset.get(e.time);n.time>=o.time&&(s=n.ticks,i=n.time),o.state===t.State.Started&&e.state!==t.State.Started&&(s+=this.frequency.getTicksAtTime(e.time)-this.frequency.getTicksAtTime(i)),o=e}.bind(this)),this._state.remove(n),s},Object.defineProperty(t.TickSource.prototype,"ticks",{get:function(){return this.getTicksAtTime(this.now())},set:function(t){this.setTicksAtTime(t,this.now())}}),Object.defineProperty(t.TickSource.prototype,"seconds",{get:function(){return this.getSecondsAtTime(this.now())},set:function(t){var e=this.now(),i=this.frequency.timeToTicks(t,e);this.setTicksAtTime(i,e)}}),t.TickSource.prototype.getSecondsAtTime=function(e){e=this.toSeconds(e);var i=this._state.getLastState(t.State.Stopped,e),n={state:t.State.Paused,time:e};this._state.add(n);var o=i,s=0;return this._state.forEachBetween(i.time,e+this.sampleTime,function(e){var i=o.time,n=this._tickOffset.get(e.time);n.time>=o.time&&(s=n.seconds,i=n.time),o.state===t.State.Started&&e.state!==t.State.Started&&(s+=e.time-i),o=e}.bind(this)),this._state.remove(n),s},t.TickSource.prototype.setTicksAtTime=function(t,e){return e=this.toSeconds(e),this._tickOffset.cancel(e),this._tickOffset.add({time:e,ticks:t,seconds:this.frequency.getDurationOfTicks(t,e)}),this},t.TickSource.prototype.getStateAtTime=function(t){return t=this.toSeconds(t),this._state.getValueAtTime(t)},t.TickSource.prototype.getTimeOfTick=function(e,i){i=t.defaultArg(i,this.now());var n=this._tickOffset.get(i),o=this._state.get(i),s=Math.max(n.time,o.time),r=this.frequency.getTicksAtTime(s)+e-n.ticks;return this.frequency.getTimeOfTick(r)},t.TickSource.prototype.forEachTickBetween=function(e,i,n){var o=this._state.get(e);if(this._state.forEachBetween(e,i,function(i){o.state===t.State.Started&&i.state!==t.State.Started&&this.forEachTickBetween(Math.max(o.time,e),i.time-this.sampleTime,n),o=i}.bind(this)),e=Math.max(o.time,e),o.state===t.State.Started&&this._state){var s=this.frequency.getTicksAtTime(e),r=(s-this.frequency.getTicksAtTime(o.time))%1;0!==r&&(r=1-r);for(var a=this.frequency.getTimeOfTick(s+r),l=null;a<i&&this._state;){try{n(a,Math.round(this.getTicksAtTime(a)))}catch(t){l=t;break}this._state&&(a+=this.frequency.getDurationOfTicks(1,a))}}if(l)throw l;return this},t.TickSource.prototype.dispose=function(){return t.Param.prototype.dispose.call(this),this._state.dispose(),this._state=null,this._tickOffset.dispose(),this._tickOffset=null,this._writable("frequency"),this.frequency.dispose(),this.frequency=null,this},t.TickSource}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(90),i(13),i(1),i(4),i(18),i(2)],void 0===(o=function(t){"use strict";return t.Follower=function(){var e=t.defaults(arguments,["smoothing"],t.Follower);t.AudioNode.call(this),this.createInsOuts(1,1),this._abs=new t.Abs,this._filter=this.context.createBiquadFilter(),this._filter.type="lowpass",this._filter.frequency.value=0,this._filter.Q.value=0,this._sub=new t.Subtract,this._delay=new t.Delay(this.blockTime),this._smoothing=e.smoothing,this.input.connect(this._delay,this._sub),this.input.connect(this._sub,0,1),this._sub.chain(this._abs,this._filter,this.output),this.smoothing=e.smoothing},t.extend(t.Follower,t.AudioNode),t.Follower.defaults={smoothing:.05},Object.defineProperty(t.Follower.prototype,"smoothing",{get:function(){return this._smoothing},set:function(e){this._smoothing=e,this._filter.frequency.value=.5*t.Time(e).toFrequency()}}),t.Follower.prototype.connect=t.SignalBase.prototype.connect,t.Follower.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._filter.disconnect(),this._filter=null,this._delay.dispose(),this._delay=null,this._sub.disconnect(),this._sub=null,this._abs.dispose(),this._abs=null,this},t.Follower}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(42),i(1),i(14),i(18),i(3),i(2)],void 0===(o=function(t){"use strict";return t.FeedbackCombFilter=function(){var e=t.defaults(arguments,["delayTime","resonance"],t.FeedbackCombFilter);t.AudioNode.call(this),this._delay=this.input=this.output=new t.Delay(e.delayTime),this.delayTime=this._delay.delayTime,this._feedback=new t.Gain(e.resonance,t.Type.NormalRange),this.resonance=this._feedback.gain,this._delay.chain(this._feedback,this._delay),this._readOnly(["resonance","delayTime"])},t.extend(t.FeedbackCombFilter,t.AudioNode),t.FeedbackCombFilter.defaults={delayTime:.1,resonance:.5},t.FeedbackCombFilter.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["resonance","delayTime"]),this._delay.dispose(),this._delay=null,this.delayTime=null,this._feedback.dispose(),this._feedback=null,this.resonance=null,this},t.FeedbackCombFilter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(9),i(1),i(3),i(2)],void 0===(o=function(t){"use strict";return t.MultibandSplit=function(){var e=t.defaults(arguments,["lowFrequency","highFrequency"],t.MultibandSplit);t.AudioNode.call(this),this.input=new t.Gain,this.output=new Array(3),this.low=this.output[0]=new t.Filter(0,"lowpass"),this._lowMidFilter=new t.Filter(0,"highpass"),this.mid=this.output[1]=new t.Filter(0,"lowpass"),this.high=this.output[2]=new t.Filter(0,"highpass"),this.lowFrequency=new t.Signal(e.lowFrequency,t.Type.Frequency),this.highFrequency=new t.Signal(e.highFrequency,t.Type.Frequency),this.Q=new t.Signal(e.Q),this.input.fan(this.low,this.high),this.input.chain(this._lowMidFilter,this.mid),this.lowFrequency.connect(this.low.frequency),this.lowFrequency.connect(this._lowMidFilter.frequency),this.highFrequency.connect(this.mid.frequency),this.highFrequency.connect(this.high.frequency),this.Q.connect(this.low.Q),this.Q.connect(this._lowMidFilter.Q),this.Q.connect(this.mid.Q),this.Q.connect(this.high.Q),this._readOnly(["high","mid","low","highFrequency","lowFrequency"])},t.extend(t.MultibandSplit,t.AudioNode),t.MultibandSplit.defaults={lowFrequency:400,highFrequency:2500,Q:1},t.MultibandSplit.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["high","mid","low","highFrequency","lowFrequency"]),this.low.dispose(),this.low=null,this._lowMidFilter.dispose(),this._lowMidFilter=null,this.mid.dispose(),this.mid=null,this.high.dispose(),this.high=null,this.lowFrequency.dispose(),this.lowFrequency=null,this.highFrequency.dispose(),this.highFrequency=null,this.Q.dispose(),this.Q=null,this},t.MultibandSplit}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(23),i(10),i(19),i(92),i(1),i(22),i(28),i(2)],void 0===(o=function(t){"use strict";return t.Panner=function(e){t.AudioNode.call(this),this._panner=this.input=this.output=this.context.createStereoPanner(),this.pan=this._panner.pan,this.pan.value=t.defaultArg(e,0),this._readOnly("pan")},t.extend(t.Panner,t.AudioNode),t.Panner.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable("pan"),this._panner.disconnect(),this._panner=null,this.pan=null,this},t.Panner}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7)],void 0===(o=function(t){"use strict";return t.Pow=function(e){t.SignalBase.call(this),this._exp=t.defaultArg(e,1),this._expScaler=this.input=this.output=new t.WaveShaper(this._expFunc(this._exp),8192)},t.extend(t.Pow,t.SignalBase),Object.defineProperty(t.Pow.prototype,"value",{get:function(){return this._exp},set:function(t){this._exp=t,this._expScaler.setMap(this._expFunc(this._exp))}}),t.Pow.prototype._expFunc=function(t){return function(e){return Math.pow(Math.abs(e),t)}},t.Pow.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._expScaler.dispose(),this._expScaler=null,this},t.Pow}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(20),i(66)],void 0===(o=function(t){return t.OfflineContext=function(e,i,n){var o=new OfflineAudioContext(e,i*n,n);t.Context.call(this,{context:o,clockSource:"offline",lookAhead:0,updateInterval:128/n}),this._duration=i,this._currentTime=0},t.extend(t.OfflineContext,t.Context),t.OfflineContext.prototype.now=function(){return this._currentTime},t.OfflineContext.prototype.resume=function(){return Promise.resolve()},t.OfflineContext.prototype.render=function(){for(;this._duration-this._currentTime>=0;)this.emit("tick"),this._currentTime+=this.blockTime;return this._context.startRendering()},t.OfflineContext.prototype.close=function(){return this._context=null,Promise.resolve()},t.OfflineContext}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(62)],void 0===(o=function(t){if(t.supported){var e=navigator.userAgent.toLowerCase();e.includes("safari")&&!e.includes("chrome")&&e.includes("mobile")&&(t.OfflineContext.prototype.createBufferSource=function(){var t=this._context.createBufferSource(),e=t.start;return t.start=function(i){this.setTimeout(function(){e.call(t,i)}.bind(this),0)}.bind(this),t})}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){return t.TimeBase=function(e,i){if(!(this instanceof t.TimeBase))return new t.TimeBase(e,i);if(this._val=e,this._units=i,t.isUndef(this._units)&&t.isString(this._val)&&parseFloat(this._val)==this._val&&"+"!==this._val.charAt(0))this._val=parseFloat(this._val),this._units=this._defaultUnits;else if(e&&e.constructor===this.constructor)this._val=e._val,this._units=e._units;else if(e instanceof t.TimeBase)switch(this._defaultUnits){case"s":this._val=e.toSeconds();break;case"i":this._val=e.toTicks();break;case"hz":this._val=e.toFrequency();break;case"midi":this._val=e.toMidi();break;default:throw new Error("Unrecognized default units "+this._defaultUnits)}},t.extend(t.TimeBase),t.TimeBase.prototype._expressions={n:{regexp:/^(\d+)n(\.?)$/i,method:function(t,e){t=parseInt(t);var i="."===e?1.5:1;return 1===t?this._beatsToUnits(this._getTimeSignature())*i:this._beatsToUnits(4/t)*i}},t:{regexp:/^(\d+)t$/i,method:function(t){return t=parseInt(t),this._beatsToUnits(8/(3*parseInt(t)))}},m:{regexp:/^(\d+)m$/i,method:function(t){return this._beatsToUnits(parseInt(t)*this._getTimeSignature())}},i:{regexp:/^(\d+)i$/i,method:function(t){return this._ticksToUnits(parseInt(t))}},hz:{regexp:/^(\d+(?:\.\d+)?)hz$/i,method:function(t){return this._frequencyToUnits(parseFloat(t))}},tr:{regexp:/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?$/,method:function(t,e,i){var n=0;return t&&"0"!==t&&(n+=this._beatsToUnits(this._getTimeSignature()*parseFloat(t))),e&&"0"!==e&&(n+=this._beatsToUnits(parseFloat(e))),i&&"0"!==i&&(n+=this._beatsToUnits(parseFloat(i)/4)),n}},s:{regexp:/^(\d+(?:\.\d+)?)s$/,method:function(t){return this._secondsToUnits(parseFloat(t))}},samples:{regexp:/^(\d+)samples$/,method:function(t){return parseInt(t)/this.context.sampleRate}},default:{regexp:/^(\d+(?:\.\d+)?)$/,method:function(t){return this._expressions[this._defaultUnits].method.call(this,t)}}},t.TimeBase.prototype._defaultUnits="s",t.TimeBase.prototype._getBpm=function(){return t.Transport?t.Transport.bpm.value:120},t.TimeBase.prototype._getTimeSignature=function(){return t.Transport?t.Transport.timeSignature:4},t.TimeBase.prototype._getPPQ=function(){return t.Transport?t.Transport.PPQ:192},t.TimeBase.prototype._now=function(){return this.now()},t.TimeBase.prototype._frequencyToUnits=function(t){return 1/t},t.TimeBase.prototype._beatsToUnits=function(t){return 60/this._getBpm()*t},t.TimeBase.prototype._secondsToUnits=function(t){return t},t.TimeBase.prototype._ticksToUnits=function(t){return t*(this._beatsToUnits(1)/this._getPPQ())},t.TimeBase.prototype._noArg=function(){return this._now()},t.TimeBase.prototype.valueOf=function(){if(t.isUndef(this._val))return this._noArg();if(t.isString(this._val)&&t.isUndef(this._units)){for(var e in this._expressions)if(this._expressions[e].regexp.test(this._val.trim())){this._units=e;break}}else if(t.isObject(this._val)){var i=0;for(var n in this._val){var o=this._val[n];i+=new this.constructor(n).valueOf()*o}return i}if(t.isDefined(this._units)){var s=this._expressions[this._units],r=this._val.toString().trim().match(s.regexp);return r?s.method.apply(this,r.slice(1)):s.method.call(this,parseFloat(this._val))}return this._val},t.TimeBase.prototype.toSeconds=function(){return this.valueOf()},t.TimeBase.prototype.toFrequency=function(){return 1/this.toSeconds()},t.TimeBase.prototype.toSamples=function(){return this.toSeconds()*this.context.sampleRate},t.TimeBase.prototype.toMilliseconds=function(){return 1e3*this.toSeconds()},t.TimeBase.prototype.dispose=function(){this._val=null,this._units=null},t.TimeBase}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(64),i(46)],void 0===(o=function(t){return t.Time=function(e,i){if(!(this instanceof t.Time))return new t.Time(e,i);t.TimeBase.call(this,e,i)},t.extend(t.Time,t.TimeBase),t.Time.prototype._expressions=Object.assign({},t.TimeBase.prototype._expressions,{quantize:{regexp:/^@(.+)/,method:function(e){if(t.Transport){var i=new this.constructor(e);return this._secondsToUnits(t.Transport.nextSubdivision(i))}return 0}},now:{regexp:/^\+(.+)/,method:function(t){return this._now()+new this.constructor(t)}}}),t.Time.prototype.quantize=function(e,i){i=t.defaultArg(i,1);var n=new this.constructor(e),o=this.valueOf();return o+(Math.round(o/n)*n-o)*i},t.Time.prototype.toNotation=function(){for(var e=this.toSeconds(),i=["1m"],n=1;n<8;n++){var o=Math.pow(2,n);i.push(o+"n."),i.push(o+"n"),i.push(o+"t")}i.push("0");var s=i[0],r=t.Time(i[0]).toSeconds();return i.forEach(function(i){var n=t.Time(i).toSeconds();Math.abs(n-e)<Math.abs(r-e)&&(s=i,r=n)}),s},t.Time.prototype.toBarsBeatsSixteenths=function(){var t=this._beatsToUnits(1),e=this.valueOf()/t;e=parseFloat(e.toFixed(4));var i=Math.floor(e/this._getTimeSignature()),n=e%1*4;return e=Math.floor(e)%this._getTimeSignature(),(n=n.toString()).length>3&&(n=parseFloat(parseFloat(n).toFixed(3))),[i,e,n].join(":")},t.Time.prototype.toTicks=function(){var t=this._beatsToUnits(1),e=this.valueOf()/t;return Math.round(e*this._getPPQ())},t.Time.prototype.toSeconds=function(){return this.valueOf()},t.Time.prototype.toMidi=function(){return t.Frequency.ftom(this.toFrequency())},t.Time}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){if(t.supported){!t.global.hasOwnProperty("OfflineAudioContext")&&t.global.hasOwnProperty("webkitOfflineAudioContext")&&(t.global.OfflineAudioContext=t.global.webkitOfflineAudioContext);var e=new OfflineAudioContext(1,1,44100).startRendering();e&&t.isFunction(e.then)||(OfflineAudioContext.prototype._native_startRendering=OfflineAudioContext.prototype.startRendering,OfflineAudioContext.prototype.startRendering=function(){return new Promise(function(t){this.oncomplete=function(e){t(e.renderedBuffer)},this._native_startRendering()}.bind(this))})}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11),i(6),i(56),i(31)],void 0===(o=function(t){"use strict";return t.Player=function(e){var i;e instanceof t.Buffer&&e.loaded?(e=e.get(),i=t.Player.defaults):i=t.defaults(arguments,["url","onload"],t.Player),t.Source.call(this,i),this.autostart=i.autostart,this._buffer=new t.Buffer({url:i.url,onload:this._onload.bind(this,i.onload),reverse:i.reverse}),e instanceof AudioBuffer&&this._buffer.set(e),this._loop=i.loop,this._loopStart=i.loopStart,this._loopEnd=i.loopEnd,this._playbackRate=i.playbackRate,this._activeSources=[],this.fadeIn=i.fadeIn,this.fadeOut=i.fadeOut},t.extend(t.Player,t.Source),t.Player.defaults={onload:t.noOp,playbackRate:1,loop:!1,autostart:!1,loopStart:0,loopEnd:0,reverse:!1,fadeIn:0,fadeOut:0},t.Player.prototype.load=function(t,e){return this._buffer.load(t,this._onload.bind(this,e))},t.Player.prototype._onload=function(e){(e=t.defaultArg(e,t.noOp))(this),this.autostart&&this.start()},t.Player.prototype._onSourceEnd=function(e){var i=this._activeSources.indexOf(e);this._activeSources.splice(i,1),0!==this._activeSources.length||this._synced||this._state.setStateAtTime(t.State.Stopped,t.now())},t.Player.prototype._start=function(e,i,n){i=this._loop?t.defaultArg(i,this._loopStart):t.defaultArg(i,0),i=this.toSeconds(i);var o=t.defaultArg(n,Math.max(this._buffer.duration-i,0));o=this.toSeconds(o),o/=this._playbackRate,e=this.toSeconds(e);var s=new t.BufferSource({buffer:this._buffer,loop:this._loop,loopStart:this._loopStart,loopEnd:this._loopEnd,onended:this._onSourceEnd.bind(this),playbackRate:this._playbackRate,fadeIn:this.fadeIn,fadeOut:this.fadeOut}).connect(this.output);return this._loop||this._synced||this._state.setStateAtTime(t.State.Stopped,e+o),this._activeSources.push(s),this._loop&&t.isUndef(n)?s.start(e,i):s.start(e,i,o-this.toSeconds(this.fadeOut)),this},t.Player.prototype._stop=function(t){return t=this.toSeconds(t),this._activeSources.forEach(function(e){e.stop(t)}),this},t.Player.prototype.restart=function(t,e,i){return this._stop(t),this._start(t,e,i),this},t.Player.prototype.seek=function(e,i){return i=this.toSeconds(i),this._state.getValueAtTime(i)===t.State.Started&&(e=this.toSeconds(e),this._stop(i),this._start(i,e)),this},t.Player.prototype.setLoopPoints=function(t,e){return this.loopStart=t,this.loopEnd=e,this},Object.defineProperty(t.Player.prototype,"loopStart",{get:function(){return this._loopStart},set:function(t){this._loopStart=t,this._activeSources.forEach(function(e){e.loopStart=t})}}),Object.defineProperty(t.Player.prototype,"loopEnd",{get:function(){return this._loopEnd},set:function(t){this._loopEnd=t,this._activeSources.forEach(function(e){e.loopEnd=t})}}),Object.defineProperty(t.Player.prototype,"buffer",{get:function(){return this._buffer},set:function(t){this._buffer.set(t)}}),Object.defineProperty(t.Player.prototype,"loop",{get:function(){return this._loop},set:function(e){if(this._loop!==e&&(this._loop=e,this._activeSources.forEach(function(t){t.loop=e}),e)){var i=this._state.getNextState(t.State.Stopped,this.now());i&&this._state.cancel(i.time)}}}),Object.defineProperty(t.Player.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(e){this._playbackRate=e;var i=this.now(),n=this._state.getNextState(t.State.Stopped,i);n&&this._state.cancel(n.time),this._activeSources.forEach(function(t){t.cancelStop(),t.playbackRate.setValueAtTime(e,i)})}}),Object.defineProperty(t.Player.prototype,"reverse",{get:function(){return this._buffer.reverse},set:function(t){this._buffer.reverse=t}}),Object.defineProperty(t.Player.prototype,"loaded",{get:function(){return this._buffer.loaded}}),t.Player.prototype.dispose=function(){return this._activeSources.forEach(function(t){t.dispose()}),this._activeSources=null,t.Source.prototype.dispose.call(this),this._buffer.dispose(),this._buffer=null,this},t.Player}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(30),i(41),i(37),i(1),i(9),i(25)],void 0===(o=function(t){"use strict";return t.MonoSynth=function(e){e=t.defaultArg(e,t.MonoSynth.defaults),t.Monophonic.call(this,e),this.oscillator=new t.OmniOscillator(e.oscillator),this.frequency=this.oscillator.frequency,this.detune=this.oscillator.detune,this.filter=new t.Filter(e.filter),this.filter.frequency.value=5e3,this.filterEnvelope=new t.FrequencyEnvelope(e.filterEnvelope),this.envelope=new t.AmplitudeEnvelope(e.envelope),this.oscillator.chain(this.filter,this.envelope,this.output),this.filterEnvelope.connect(this.filter.frequency),this._readOnly(["oscillator","frequency","detune","filter","filterEnvelope","envelope"])},t.extend(t.MonoSynth,t.Monophonic),t.MonoSynth.defaults={frequency:"C4",detune:0,oscillator:{type:"square"},filter:{Q:6,type:"lowpass",rolloff:-24},envelope:{attack:.005,decay:.1,sustain:.9,release:1},filterEnvelope:{attack:.06,decay:.2,sustain:.5,release:2,baseFrequency:200,octaves:7,exponent:2}},t.MonoSynth.prototype._triggerEnvelopeAttack=function(t,e){return t=this.toSeconds(t),this.envelope.triggerAttack(t,e),this.filterEnvelope.triggerAttack(t),this.oscillator.start(t),0===this.envelope.sustain&&this.oscillator.stop(t+this.envelope.attack+this.envelope.decay),this},t.MonoSynth.prototype._triggerEnvelopeRelease=function(t){return this.envelope.triggerRelease(t),this.filterEnvelope.triggerRelease(t),this.oscillator.stop(t+this.envelope.release),this},t.MonoSynth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["oscillator","frequency","detune","filter","filterEnvelope","envelope"]),this.oscillator.dispose(),this.oscillator=null,this.envelope.dispose(),this.envelope=null,this.filterEnvelope.dispose(),this.filterEnvelope=null,this.filter.dispose(),this.filter=null,this.frequency=null,this.detune=null,this},t.MonoSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(5),i(3)],void 0===(o=function(t){"use strict";return t.FatOscillator=function(){var e=t.defaults(arguments,["frequency","type","spread"],t.FatOscillator);t.Source.call(this,e),this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this._oscillators=[],this._spread=e.spread,this._type=e.type,this._phase=e.phase,this._partials=e.partials,this._partialCount=e.partialCount,this.count=e.count,this._readOnly(["frequency","detune"])},t.extend(t.FatOscillator,t.Source),t.FatOscillator.defaults={frequency:440,detune:0,phase:0,spread:20,count:3,type:"sawtooth",partials:[],partialCount:0},t.FatOscillator.prototype._start=function(t){t=this.toSeconds(t),this._forEach(function(e){e.start(t)})},t.FatOscillator.prototype._stop=function(t){t=this.toSeconds(t),this._forEach(function(e){e.stop(t)})},t.FatOscillator.prototype.restart=function(t){t=this.toSeconds(t),this._forEach(function(e){e.restart(t)})},t.FatOscillator.prototype._forEach=function(t){for(var e=0;e<this._oscillators.length;e++)t.call(this,this._oscillators[e],e)},Object.defineProperty(t.FatOscillator.prototype,"type",{get:function(){return this._type},set:function(t){this._type=t,this._forEach(function(e){e.type=t})}}),Object.defineProperty(t.FatOscillator.prototype,"spread",{get:function(){return this._spread},set:function(t){if(this._spread=t,this._oscillators.length>1){var e=-t/2,i=t/(this._oscillators.length-1);this._forEach(function(t,n){t.detune.value=e+i*n})}}}),Object.defineProperty(t.FatOscillator.prototype,"count",{get:function(){return this._oscillators.length},set:function(e){if(e=Math.max(e,1),this._oscillators.length!==e){this._forEach(function(t){t.dispose()}),this._oscillators=[];for(var i=0;i<e;i++){var n=new t.Oscillator;this.type===t.Oscillator.Type.Custom?n.partials=this._partials:n.type=this._type,n.partialCount=this._partialCount,n.phase=this._phase+i/e*360,n.volume.value=-6-1.1*e,this.frequency.connect(n.frequency),this.detune.connect(n.detune),n.connect(this.output),this._oscillators[i]=n}this.spread=this._spread,this.state===t.State.Started&&this._forEach(function(t){t.start()})}}}),Object.defineProperty(t.FatOscillator.prototype,"phase",{get:function(){return this._phase},set:function(t){this._phase=t,this._forEach(function(e){e.phase=t})}}),Object.defineProperty(t.FatOscillator.prototype,"baseType",{get:function(){return this._oscillators[0].baseType},set:function(t){this._forEach(function(e){e.baseType=t}),this._type=this._oscillators[0].type}}),Object.defineProperty(t.FatOscillator.prototype,"partials",{get:function(){return this._oscillators[0].partials},set:function(e){this._partials=e,this._type=t.Oscillator.Type.Custom,this._forEach(function(t){t.partials=e})}}),Object.defineProperty(t.FatOscillator.prototype,"partialCount",{get:function(){return this._oscillators[0].partialCount},set:function(t){this._partialCount=t,this._forEach(function(e){e.partialCount=t}),this._type=this._oscillators[0].type}}),t.FatOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._writable(["frequency","detune"]),this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this._forEach(function(t){t.dispose()}),this._oscillators=null,this._partials=null,this},t.FatOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(5),i(3),i(22)],void 0===(o=function(t){"use strict";return t.AMOscillator=function(){var e=t.defaults(arguments,["frequency","type","modulationType"],t.AMOscillator);t.Source.call(this,e),this._carrier=new t.Oscillator(e.frequency,e.type),this.frequency=this._carrier.frequency,this.detune=this._carrier.detune,this.detune.value=e.detune,this._modulator=new t.Oscillator(e.frequency,e.modulationType),this._modulationScale=new t.AudioToGain,this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this._modulationNode=new t.Gain(0),this.frequency.chain(this.harmonicity,this._modulator.frequency),this.detune.connect(this._modulator.detune),this._modulator.chain(this._modulationScale,this._modulationNode.gain),this._carrier.chain(this._modulationNode,this.output),this.phase=e.phase,this._readOnly(["frequency","detune","harmonicity"])},t.extend(t.AMOscillator,t.Oscillator),t.AMOscillator.defaults={frequency:440,detune:0,phase:0,type:"sine",modulationType:"square",harmonicity:1},t.AMOscillator.prototype._start=function(t){this._modulator.start(t),this._carrier.start(t)},t.AMOscillator.prototype._stop=function(t){this._modulator.stop(t),this._carrier.stop(t)},t.AMOscillator.prototype.restart=function(t){this._modulator.restart(t),this._carrier.restart(t)},Object.defineProperty(t.AMOscillator.prototype,"type",{get:function(){return this._carrier.type},set:function(t){this._carrier.type=t}}),Object.defineProperty(t.AMOscillator.prototype,"baseType",{get:function(){return this._carrier.baseType},set:function(t){this._carrier.baseType=t}}),Object.defineProperty(t.AMOscillator.prototype,"partialCount",{get:function(){return this._carrier.partialCount},set:function(t){this._carrier.partialCount=t}}),Object.defineProperty(t.AMOscillator.prototype,"modulationType",{get:function(){return this._modulator.type},set:function(t){this._modulator.type=t}}),Object.defineProperty(t.AMOscillator.prototype,"phase",{get:function(){return this._carrier.phase},set:function(t){this._carrier.phase=t,this._modulator.phase=t}}),Object.defineProperty(t.AMOscillator.prototype,"partials",{get:function(){return this._carrier.partials},set:function(t){this._carrier.partials=t}}),t.AMOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._writable(["frequency","detune","harmonicity"]),this.frequency=null,this.detune=null,this.harmonicity.dispose(),this.harmonicity=null,this._carrier.dispose(),this._carrier=null,this._modulator.dispose(),this._modulator=null,this._modulationNode.dispose(),this._modulationNode=null,this._modulationScale.dispose(),this._modulationScale=null,this},t.AMOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(49),i(17),i(5)],void 0===(o=function(t){"use strict";return t.PWMOscillator=function(){var e=t.defaults(arguments,["frequency","modulationFrequency"],t.PWMOscillator);t.Source.call(this,e),this._pulse=new t.PulseOscillator(e.modulationFrequency),this._pulse._sawtooth.type="sine",this._modulator=new t.Oscillator({frequency:e.frequency,detune:e.detune,phase:e.phase}),this._scale=new t.Multiply(2),this.frequency=this._modulator.frequency,this.detune=this._modulator.detune,this.modulationFrequency=this._pulse.frequency,this._modulator.chain(this._scale,this._pulse.width),this._pulse.connect(this.output),this._readOnly(["modulationFrequency","frequency","detune"])},t.extend(t.PWMOscillator,t.Source),t.PWMOscillator.defaults={frequency:440,detune:0,phase:0,modulationFrequency:.4},t.PWMOscillator.prototype._start=function(t){t=this.toSeconds(t),this._modulator.start(t),this._pulse.start(t)},t.PWMOscillator.prototype._stop=function(t){t=this.toSeconds(t),this._modulator.stop(t),this._pulse.stop(t)},t.PWMOscillator.prototype.restart=function(t){this._modulator.restart(t),this._pulse.restart(t)},Object.defineProperty(t.PWMOscillator.prototype,"type",{get:function(){return"pwm"}}),Object.defineProperty(t.PWMOscillator.prototype,"baseType",{get:function(){return"pwm"}}),Object.defineProperty(t.PWMOscillator.prototype,"partials",{get:function(){return[]}}),Object.defineProperty(t.PWMOscillator.prototype,"phase",{get:function(){return this._modulator.phase},set:function(t){this._modulator.phase=t}}),t.PWMOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._pulse.dispose(),this._pulse=null,this._scale.dispose(),this._scale=null,this._modulator.dispose(),this._modulator=null,this._writable(["modulationFrequency","frequency","detune"]),this.frequency=null,this.detune=null,this.modulationFrequency=null,this},t.PWMOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(50),i(4),i(16)],void 0===(o=function(t){"use strict";return t.Part=function(){var e=t.defaults(arguments,["callback","events"],t.Part);t.Event.call(this,e),this._events=[];for(var i=0;i<e.events.length;i++)Array.isArray(e.events[i])?this.add(e.events[i][0],e.events[i][1]):this.add(e.events[i])},t.extend(t.Part,t.Event),t.Part.defaults={callback:t.noOp,loop:!1,loopEnd:"1m",loopStart:0,playbackRate:1,probability:1,humanize:!1,mute:!1,events:[]},t.Part.prototype.start=function(e,i){var n=this.toTicks(e);return this._state.getValueAtTime(n)!==t.State.Started&&(i=this._loop?t.defaultArg(i,this._loopStart):t.defaultArg(i,0),i=this.toTicks(i),this._state.add({state:t.State.Started,time:n,offset:i}),this._forEach(function(t){this._startNote(t,n,i)})),this},t.Part.prototype._startNote=function(e,i,n){i-=n,this._loop?e.startOffset>=this._loopStart&&e.startOffset<this._loopEnd?(e.startOffset<n&&(i+=this._getLoopDuration()),e.start(t.Ticks(i))):e.startOffset<this._loopStart&&e.startOffset>=n&&(e.loop=!1,e.start(t.Ticks(i))):e.startOffset>=n&&e.start(t.Ticks(i))},Object.defineProperty(t.Part.prototype,"startOffset",{get:function(){return this._startOffset},set:function(t){this._startOffset=t,this._forEach(function(t){t.startOffset+=this._startOffset})}}),t.Part.prototype.stop=function(e){var i=this.toTicks(e);return this._state.cancel(i),this._state.setStateAtTime(t.State.Stopped,i),this._forEach(function(t){t.stop(e)}),this},t.Part.prototype.at=function(e,i){e=t.TransportTime(e);for(var n=t.Ticks(1).toSeconds(),o=0;o<this._events.length;o++){var s=this._events[o];if(Math.abs(e.toTicks()-s.startOffset)<n)return t.isDefined(i)&&(s.value=i),s}return t.isDefined(i)?(this.add(e,i),this._events[this._events.length-1]):null},t.Part.prototype.add=function(e,i){var n;return e.hasOwnProperty("time")&&(e=(i=e).time),e=this.toTicks(e),i instanceof t.Event?(n=i).callback=this._tick.bind(this):n=new t.Event({callback:this._tick.bind(this),value:i}),n.startOffset=e,n.set({loopEnd:this.loopEnd,loopStart:this.loopStart,loop:this.loop,humanize:this.humanize,playbackRate:this.playbackRate,probability:this.probability}),this._events.push(n),this._restartEvent(n),this},t.Part.prototype._restartEvent=function(e){this._state.forEach(function(i){i.state===t.State.Started?this._startNote(e,i.time,i.offset):e.stop(t.Ticks(i.time))}.bind(this))},t.Part.prototype.remove=function(e,i){e.hasOwnProperty("time")&&(e=(i=e).time),e=this.toTicks(e);for(var n=this._events.length-1;n>=0;n--){var o=this._events[n];o.startOffset===e&&(t.isUndef(i)||t.isDefined(i)&&o.value===i)&&(this._events.splice(n,1),o.dispose())}return this},t.Part.prototype.removeAll=function(){return this._forEach(function(t){t.dispose()}),this._events=[],this},t.Part.prototype.cancel=function(t){return this._forEach(function(e){e.cancel(t)}),this._state.cancel(this.toTicks(t)),this},t.Part.prototype._forEach=function(e,i){if(this._events){i=t.defaultArg(i,this);for(var n=this._events.length-1;n>=0;n--){var o=this._events[n];o instanceof t.Part?o._forEach(e,i):e.call(i,o)}}return this},t.Part.prototype._setAll=function(t,e){this._forEach(function(i){i[t]=e})},t.Part.prototype._tick=function(t,e){this.mute||this.callback(t,e)},t.Part.prototype._testLoopBoundries=function(e){e.startOffset<this._loopStart||e.startOffset>=this._loopEnd?e.cancel(0):e.state===t.State.Stopped&&this._restartEvent(e)},Object.defineProperty(t.Part.prototype,"probability",{get:function(){return this._probability},set:function(t){this._probability=t,this._setAll("probability",t)}}),Object.defineProperty(t.Part.prototype,"humanize",{get:function(){return this._humanize},set:function(t){this._humanize=t,this._setAll("humanize",t)}}),Object.defineProperty(t.Part.prototype,"loop",{get:function(){return this._loop},set:function(t){this._loop=t,this._forEach(function(e){e._loopStart=this._loopStart,e._loopEnd=this._loopEnd,e.loop=t,this._testLoopBoundries(e)})}}),Object.defineProperty(t.Part.prototype,"loopEnd",{get:function(){return t.Ticks(this._loopEnd).toSeconds()},set:function(t){this._loopEnd=this.toTicks(t),this._loop&&this._forEach(function(e){e.loopEnd=t,this._testLoopBoundries(e)})}}),Object.defineProperty(t.Part.prototype,"loopStart",{get:function(){return t.Ticks(this._loopStart).toSeconds()},set:function(t){this._loopStart=this.toTicks(t),this._loop&&this._forEach(function(t){t.loopStart=this.loopStart,this._testLoopBoundries(t)})}}),Object.defineProperty(t.Part.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(t){this._playbackRate=t,this._setAll("playbackRate",t)}}),Object.defineProperty(t.Part.prototype,"length",{get:function(){return this._events.length}}),t.Part.prototype.dispose=function(){return t.Event.prototype.dispose.call(this),this.removeAll(),this.callback=null,this._events=null,this},t.Part}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(50)],void 0===(o=function(t){return t.Loop=function(){var e=t.defaults(arguments,["callback","interval"],t.Loop);t.call(this),this._event=new t.Event({callback:this._tick.bind(this),loop:!0,loopEnd:e.interval,playbackRate:e.playbackRate,probability:e.probability}),this.callback=e.callback,this.iterations=e.iterations},t.extend(t.Loop),t.Loop.defaults={interval:"4n",callback:t.noOp,playbackRate:1,iterations:1/0,probability:!0,mute:!1},t.Loop.prototype.start=function(t){return this._event.start(t),this},t.Loop.prototype.stop=function(t){return this._event.stop(t),this},t.Loop.prototype.cancel=function(t){return this._event.cancel(t),this},t.Loop.prototype._tick=function(t){this.callback(t)},Object.defineProperty(t.Loop.prototype,"state",{get:function(){return this._event.state}}),Object.defineProperty(t.Loop.prototype,"progress",{get:function(){return this._event.progress}}),Object.defineProperty(t.Loop.prototype,"interval",{get:function(){return this._event.loopEnd},set:function(t){this._event.loopEnd=t}}),Object.defineProperty(t.Loop.prototype,"playbackRate",{get:function(){return this._event.playbackRate},set:function(t){this._event.playbackRate=t}}),Object.defineProperty(t.Loop.prototype,"humanize",{get:function(){return this._event.humanize},set:function(t){this._event.humanize=t}}),Object.defineProperty(t.Loop.prototype,"probability",{get:function(){return this._event.probability},set:function(t){this._event.probability=t}}),Object.defineProperty(t.Loop.prototype,"mute",{get:function(){return this._event.mute},set:function(t){this._event.mute=t}}),Object.defineProperty(t.Loop.prototype,"iterations",{get:function(){return!0===this._event.loop?1/0:this._event.loop},set:function(t){this._event.loop=t===1/0||t}}),t.Loop.prototype.dispose=function(){this._event.dispose(),this._event=null,this.callback=null},t.Loop}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(15),i(32)],void 0===(o=function(t){"use strict";return t.StereoXFeedbackEffect=function(){var e=t.defaults(arguments,["feedback"],t.FeedbackEffect);t.StereoEffect.call(this,e),this.feedback=new t.Signal(e.feedback,t.Type.NormalRange),this._feedbackLR=new t.Gain,this._feedbackRL=new t.Gain,this.effectReturnL.chain(this._feedbackLR,this.effectSendR),this.effectReturnR.chain(this._feedbackRL,this.effectSendL),this.feedback.fan(this._feedbackLR.gain,this._feedbackRL.gain),this._readOnly(["feedback"])},t.extend(t.StereoXFeedbackEffect,t.StereoEffect),t.StereoXFeedbackEffect.prototype.dispose=function(){return t.StereoEffect.prototype.dispose.call(this),this._writable(["feedback"]),this.feedback.dispose(),this.feedback=null,this._feedbackLR.dispose(),this._feedbackLR=null,this._feedbackRL.dispose(),this._feedbackRL=null,this},t.StereoXFeedbackEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(52),i(51)],void 0===(o=function(t){"use strict";return t.MidSideEffect=function(){t.Effect.apply(this,arguments),this._midSideSplit=new t.MidSideSplit,this._midSideMerge=new t.MidSideMerge,this.midSend=this._midSideSplit.mid,this.sideSend=this._midSideSplit.side,this.midReturn=this._midSideMerge.mid,this.sideReturn=this._midSideMerge.side,this.effectSend.connect(this._midSideSplit),this._midSideMerge.connect(this.effectReturn)},t.extend(t.MidSideEffect,t.Effect),t.MidSideEffect.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._midSideSplit.dispose(),this._midSideSplit=null,this._midSideMerge.dispose(),this._midSideMerge=null,this.midSend=null,this.sideSend=null,this.midReturn=null,this.sideReturn=null,this},t.MidSideEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11),i(8)],void 0===(o=function(t){"use strict";return t.Convolver=function(){var e=t.defaults(arguments,["url","onload"],t.Convolver);t.Effect.call(this,e),this._convolver=this.context.createConvolver(),this._buffer=new t.Buffer(e.url,function(t){this.buffer=t.get(),e.onload()}.bind(this)),this._buffer.loaded&&(this.buffer=this._buffer),this.normalize=e.normalize,this.connectEffect(this._convolver)},t.extend(t.Convolver,t.Effect),t.Convolver.defaults={onload:t.noOp,normalize:!0},Object.defineProperty(t.Convolver.prototype,"buffer",{get:function(){return this._buffer.length?this._buffer:null},set:function(t){this._buffer.set(t),this._convolver.buffer&&(this.effectSend.disconnect(),this._convolver.disconnect(),this._convolver=this.context.createConvolver(),this.connectEffect(this._convolver)),this._convolver.buffer=this._buffer.get()}}),Object.defineProperty(t.Convolver.prototype,"normalize",{get:function(){return this._convolver.normalize},set:function(t){this._convolver.normalize=t}}),t.Convolver.prototype.load=function(t,e){return this._buffer.load(t,function(t){this.buffer=t,e&&e()}.bind(this))},t.Convolver.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._buffer.dispose(),this._buffer=null,this._convolver.disconnect(),this._convolver=null,this},t.Convolver}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(5),i(13)],void 0===(o=function(t){"use strict";return t.Modulo=function(e){t.SignalBase.call(this),this.createInsOuts(1,0),this._shaper=new t.WaveShaper(Math.pow(2,16)),this._multiply=new t.Multiply,this._subtract=this.output=new t.Subtract,this._modSignal=new t.Signal(e),this.input.fan(this._shaper,this._subtract),this._modSignal.connect(this._multiply,0,0),this._shaper.connect(this._multiply,0,1),this._multiply.connect(this._subtract,0,1),this._setWaveShaper(e)},t.extend(t.Modulo,t.SignalBase),t.Modulo.prototype._setWaveShaper=function(t){this._shaper.setMap(function(e){return Math.floor((e+1e-4)/t)})},Object.defineProperty(t.Modulo.prototype,"value",{get:function(){return this._modSignal.value},set:function(t){this._modSignal.value=t,this._setWaveShaper(t)}}),t.Modulo.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._shaper.dispose(),this._shaper=null,this._multiply.dispose(),this._multiply=null,this._subtract.dispose(),this._subtract=null,this._modSignal.dispose(),this._modSignal=null,this},t.Modulo}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(16),i(11),i(62),i(40)],void 0===(o=function(t){return t.Offline=function(e,i){var n=t.context.sampleRate,o=t.context,s=new t.OfflineContext(2,i,n);t.context=s;var r=e(t.Transport),a=null;return a=r&&t.isFunction(r.then)?r.then(function(){return s.render()}):s.render(),t.context=o,a.then(function(e){return new t.Buffer(e)})},t.Offline}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11)],void 0===(o=function(t){return t.Buffers=function(e){var i=Array.prototype.slice.call(arguments);i.shift();var n=t.defaults(i,["onload","baseUrl"],t.Buffers);for(var o in t.call(this),this._buffers={},this.baseUrl=n.baseUrl,this._loadingCount=0,e)this._loadingCount++,this.add(o,e[o],this._bufferLoaded.bind(this,n.onload))},t.extend(t.Buffers),t.Buffers.defaults={onload:t.noOp,baseUrl:""},t.Buffers.prototype.has=function(t){return this._buffers.hasOwnProperty(t)},t.Buffers.prototype.get=function(t){if(this.has(t))return this._buffers[t];throw new Error("Tone.Buffers: no buffer named "+t)},t.Buffers.prototype._bufferLoaded=function(t){this._loadingCount--,0===this._loadingCount&&t&&t(this)},Object.defineProperty(t.Buffers.prototype,"loaded",{get:function(){var t=!0;for(var e in this._buffers){var i=this.get(e);t=t&&i.loaded}return t}}),t.Buffers.prototype.add=function(e,i,n){return n=t.defaultArg(n,t.noOp),i instanceof t.Buffer?(this._buffers[e]=i,n(this)):i instanceof AudioBuffer?(this._buffers[e]=new t.Buffer(i),n(this)):t.isString(i)&&(this._buffers[e]=new t.Buffer(this.baseUrl+i,n)),this},t.Buffers.prototype.dispose=function(){for(var e in t.prototype.dispose.call(this),this._buffers)this._buffers[e].dispose();return this._buffers=null,this},t.Buffers}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){"use strict";return t.CtrlPattern=function(){var e=t.defaults(arguments,["values","type"],t.CtrlPattern);t.call(this),this.values=e.values,this.index=0,this._type=null,this._shuffled=null,this._direction=null,this.type=e.type},t.extend(t.CtrlPattern),t.CtrlPattern.Type={Up:"up",Down:"down",UpDown:"upDown",DownUp:"downUp",AlternateUp:"alternateUp",AlternateDown:"alternateDown",Random:"random",RandomWalk:"randomWalk",RandomOnce:"randomOnce"},t.CtrlPattern.defaults={type:t.CtrlPattern.Type.Up,values:[]},Object.defineProperty(t.CtrlPattern.prototype,"value",{get:function(){if(0!==this.values.length){if(1===this.values.length)return this.values[0];this.index=Math.min(this.index,this.values.length-1);var e=this.values[this.index];return this.type===t.CtrlPattern.Type.RandomOnce&&(this.values.length!==this._shuffled.length&&this._shuffleValues(),e=this.values[this._shuffled[this.index]]),e}}}),Object.defineProperty(t.CtrlPattern.prototype,"type",{get:function(){return this._type},set:function(e){this._type=e,this._shuffled=null,this._type===t.CtrlPattern.Type.Up||this._type===t.CtrlPattern.Type.UpDown||this._type===t.CtrlPattern.Type.RandomOnce||this._type===t.CtrlPattern.Type.AlternateUp?this.index=0:this._type!==t.CtrlPattern.Type.Down&&this._type!==t.CtrlPattern.Type.DownUp&&this._type!==t.CtrlPattern.Type.AlternateDown||(this.index=this.values.length-1),this._type===t.CtrlPattern.Type.UpDown||this._type===t.CtrlPattern.Type.AlternateUp?this._direction=t.CtrlPattern.Type.Up:this._type!==t.CtrlPattern.Type.DownUp&&this._type!==t.CtrlPattern.Type.AlternateDown||(this._direction=t.CtrlPattern.Type.Down),this._type===t.CtrlPattern.Type.RandomOnce?this._shuffleValues():this._type===t.CtrlPattern.Random&&(this.index=Math.floor(Math.random()*this.values.length))}}),t.CtrlPattern.prototype.next=function(){var e=this.type;return e===t.CtrlPattern.Type.Up?(this.index++,this.index>=this.values.length&&(this.index=0)):e===t.CtrlPattern.Type.Down?(this.index--,this.index<0&&(this.index=this.values.length-1)):e===t.CtrlPattern.Type.UpDown||e===t.CtrlPattern.Type.DownUp?(this._direction===t.CtrlPattern.Type.Up?this.index++:this.index--,this.index<0?(this.index=1,this._direction=t.CtrlPattern.Type.Up):this.index>=this.values.length&&(this.index=this.values.length-2,this._direction=t.CtrlPattern.Type.Down)):e===t.CtrlPattern.Type.Random?this.index=Math.floor(Math.random()*this.values.length):e===t.CtrlPattern.Type.RandomWalk?Math.random()<.5?(this.index--,this.index=Math.max(this.index,0)):(this.index++,this.index=Math.min(this.index,this.values.length-1)):e===t.CtrlPattern.Type.RandomOnce?(this.index++,this.index>=this.values.length&&(this.index=0,this._shuffleValues())):e===t.CtrlPattern.Type.AlternateUp?(this._direction===t.CtrlPattern.Type.Up?(this.index+=2,this._direction=t.CtrlPattern.Type.Down):(this.index-=1,this._direction=t.CtrlPattern.Type.Up),this.index>=this.values.length&&(this.index=0,this._direction=t.CtrlPattern.Type.Up)):e===t.CtrlPattern.Type.AlternateDown&&(this._direction===t.CtrlPattern.Type.Up?(this.index+=1,this._direction=t.CtrlPattern.Type.Down):(this.index-=2,this._direction=t.CtrlPattern.Type.Up),this.index<0&&(this.index=this.values.length-1,this._direction=t.CtrlPattern.Type.Down)),this.value},t.CtrlPattern.prototype._shuffleValues=function(){var t=[];this._shuffled=[];for(var e=0;e<this.values.length;e++)t[e]=e;for(;t.length>0;){var i=t.splice(Math.floor(t.length*Math.random()),1);this._shuffled.push(i[0])}},t.CtrlPattern.prototype.dispose=function(){this._shuffled=null,this.values=null},t.CtrlPattern}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){t.supported&&(AudioBuffer.prototype.copyToChannel||(AudioBuffer.prototype.copyToChannel=function(t,e,i){var n=this.getChannelData(e);i=i||0;for(var o=0;o<n.length;o++)n[o+i]=t[o]},AudioBuffer.prototype.copyFromChannel=function(t,e,i){var n=this.getChannelData(e);i=i||0;for(var o=0;o<t.length;o++)t[o]=n[o+i]}))}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11),i(6),i(3),i(2)],void 0===(o=function(t){return t.OscillatorNode=function(){var e=t.defaults(arguments,["frequency","type"],t.OscillatorNode);t.AudioNode.call(this,e),this.onended=e.onended,this._startTime=-1,this._stopTime=-1,this._gainNode=this.output=new t.Gain(0),this._oscillator=this.context.createOscillator(),this._oscillator.connect(this._gainNode),this.type=e.type,this.frequency=new t.Param({param:this._oscillator.frequency,units:t.Type.Frequency,value:e.frequency}),this.detune=new t.Param({param:this._oscillator.detune,units:t.Type.Cents,value:e.detune}),this._gain=1},t.extend(t.OscillatorNode,t.AudioNode),t.OscillatorNode.defaults={frequency:440,detune:0,type:"sine",onended:t.noOp},Object.defineProperty(t.OscillatorNode.prototype,"state",{get:function(){return this.getStateAtTime(this.now())}}),t.OscillatorNode.prototype.getStateAtTime=function(e){return e=this.toSeconds(e),-1!==this._startTime&&e>=this._startTime&&(-1===this._stopTime||e<=this._stopTime)?t.State.Started:t.State.Stopped},t.OscillatorNode.prototype.start=function(t){if(this.log("start",t),-1!==this._startTime)throw new Error("cannot call OscillatorNode.start more than once");return this._startTime=this.toSeconds(t),this._oscillator.start(this._startTime),this._gainNode.gain.setValueAtTime(1,this._startTime),this},t.OscillatorNode.prototype.setPeriodicWave=function(t){return this._oscillator.setPeriodicWave(t),this},t.OscillatorNode.prototype.stop=function(t){return this.log("stop",t),this.assert(-1!==this._startTime,"'start' must be called before 'stop'"),this.cancelStop(),this._stopTime=this.toSeconds(t),this._stopTime>this._startTime?(this._gainNode.gain.setValueAtTime(0,this._stopTime),this.context.clearTimeout(this._timeout),this._timeout=this.context.setTimeout(function(){this._oscillator.stop(this.now()),this.onended()}.bind(this),this._stopTime-this.context.currentTime)):this._gainNode.gain.cancelScheduledValues(this._startTime),this},t.OscillatorNode.prototype.cancelStop=function(){return-1!==this._startTime&&(this._gainNode.gain.cancelScheduledValues(this._startTime+this.sampleTime),this.context.clearTimeout(this._timeout),this._stopTime=-1),this},Object.defineProperty(t.OscillatorNode.prototype,"type",{get:function(){return this._oscillator.type},set:function(t){this._oscillator.type=t}}),t.OscillatorNode.prototype.dispose=function(){return this.context.clearTimeout(this._timeout),t.AudioNode.prototype.dispose.call(this),this.onended=null,this._oscillator.disconnect(),this._oscillator=null,this._gainNode.dispose(),this._gainNode=null,this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this},t.OscillatorNode}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(55),i(54)],void 0===(o=function(t){return t.TransportRepeatEvent=function(e,i){t.TransportEvent.call(this,e,i),i=t.defaultArg(i,t.TransportRepeatEvent.defaults),this.duration=t.Ticks(i.duration),this._interval=t.Ticks(i.interval),this._currentId=-1,this._nextId=-1,this._nextTick=this.time,this._boundRestart=this._restart.bind(this),this.Transport.on("start loopStart",this._boundRestart),this._restart()},t.extend(t.TransportRepeatEvent,t.TransportEvent),t.TransportRepeatEvent.defaults={duration:1/0,interval:1},t.TransportRepeatEvent.prototype.invoke=function(e){this._createEvents(e),t.TransportEvent.prototype.invoke.call(this,e)},t.TransportRepeatEvent.prototype._createEvents=function(e){var i=this.Transport.getTicksAtTime(e);i>=this.time&&i>=this._nextTick&&this._nextTick+this._interval<this.time+this.duration&&(this._nextTick+=this._interval,this._currentId=this._nextId,this._nextId=this.Transport.scheduleOnce(this.invoke.bind(this),t.Ticks(this._nextTick)))},t.TransportRepeatEvent.prototype._restart=function(e){this.Transport.clear(this._currentId),this.Transport.clear(this._nextId),this._nextTick=this.time;var i=this.Transport.getTicksAtTime(e);i>this.time&&(this._nextTick=this.time+Math.ceil((i-this.time)/this._interval)*this._interval),this._currentId=this.Transport.scheduleOnce(this.invoke.bind(this),t.Ticks(this._nextTick)),this._nextTick+=this._interval,this._nextId=this.Transport.scheduleOnce(this.invoke.bind(this),t.Ticks(this._nextTick))},t.TransportRepeatEvent.prototype.dispose=function(){return this.Transport.clear(this._currentId),this.Transport.clear(this._nextId),this.Transport.off("start loopStart",this._boundRestart),this._boundCreateEvents=null,t.TransportEvent.prototype.dispose.call(this),this.duration=null,this._interval=null,this},t.TransportRepeatEvent}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4)],void 0===(o=function(t){"use strict";t.IntervalTimeline=function(){t.call(this),this._root=null,this._length=0},t.extend(t.IntervalTimeline),t.IntervalTimeline.prototype.add=function(i){if(t.isUndef(i.time)||t.isUndef(i.duration))throw new Error("Tone.IntervalTimeline: events must have time and duration parameters");i.time=i.time.valueOf();var n=new e(i.time,i.time+i.duration,i);for(null===this._root?this._root=n:this._root.insert(n),this._length++;null!==n;)n.updateHeight(),n.updateMax(),this._rebalance(n),n=n.parent;return this},t.IntervalTimeline.prototype.remove=function(t){if(null!==this._root){var e=[];this._root.search(t.time,e);for(var i=0;i<e.length;i++){var n=e[i];if(n.event===t){this._removeNode(n),this._length--;break}}}return this},Object.defineProperty(t.IntervalTimeline.prototype,"length",{get:function(){return this._length}}),t.IntervalTimeline.prototype.cancel=function(t){return this.forEachFrom(t,function(t){this.remove(t)}.bind(this)),this},t.IntervalTimeline.prototype._setRoot=function(t){this._root=t,null!==this._root&&(this._root.parent=null)},t.IntervalTimeline.prototype._replaceNodeInParent=function(t,e){null!==t.parent?(t.isLeftChild()?t.parent.left=e:t.parent.right=e,this._rebalance(t.parent)):this._setRoot(e)},t.IntervalTimeline.prototype._removeNode=function(t){if(null===t.left&&null===t.right)this._replaceNodeInParent(t,null);else if(null===t.right)this._replaceNodeInParent(t,t.left);else if(null===t.left)this._replaceNodeInParent(t,t.right);else{var e,i;if(t.getBalance()>0)if(null===t.left.right)(e=t.left).right=t.right,i=e;else{for(e=t.left.right;null!==e.right;)e=e.right;e.parent.right=e.left,i=e.parent,e.left=t.left,e.right=t.right}else if(null===t.right.left)(e=t.right).left=t.left,i=e;else{for(e=t.right.left;null!==e.left;)e=e.left;e.parent=e.parent,e.parent.left=e.right,i=e.parent,e.left=t.left,e.right=t.right}null!==t.parent?t.isLeftChild()?t.parent.left=e:t.parent.right=e:this._setRoot(e),this._rebalance(i)}t.dispose()},t.IntervalTimeline.prototype._rotateLeft=function(t){var e=t.parent,i=t.isLeftChild(),n=t.right;t.right=n.left,n.left=t,null!==e?i?e.left=n:e.right=n:this._setRoot(n)},t.IntervalTimeline.prototype._rotateRight=function(t){var e=t.parent,i=t.isLeftChild(),n=t.left;t.left=n.right,n.right=t,null!==e?i?e.left=n:e.right=n:this._setRoot(n)},t.IntervalTimeline.prototype._rebalance=function(t){var e=t.getBalance();e>1?t.left.getBalance()<0?this._rotateLeft(t.left):this._rotateRight(t):e<-1&&(t.right.getBalance()>0?this._rotateRight(t.right):this._rotateLeft(t))},t.IntervalTimeline.prototype.get=function(t){if(null!==this._root){var e=[];if(this._root.search(t,e),e.length>0){for(var i=e[0],n=1;n<e.length;n++)e[n].low>i.low&&(i=e[n]);return i.event}}return null},t.IntervalTimeline.prototype.forEach=function(t){if(null!==this._root){var e=[];this._root.traverse(function(t){e.push(t)});for(var i=0;i<e.length;i++){var n=e[i].event;n&&t(n)}}return this},t.IntervalTimeline.prototype.forEachAtTime=function(t,e){if(null!==this._root){var i=[];this._root.search(t,i);for(var n=i.length-1;n>=0;n--){var o=i[n].event;o&&e(o)}}return this},t.IntervalTimeline.prototype.forEachFrom=function(t,e){if(null!==this._root){var i=[];this._root.searchAfter(t,i);for(var n=i.length-1;n>=0;n--){e(i[n].event)}}return this},t.IntervalTimeline.prototype.dispose=function(){var t=[];null!==this._root&&this._root.traverse(function(e){t.push(e)});for(var e=0;e<t.length;e++)t[e].dispose();return t=null,this._root=null,this};var e=function(t,e,i){this.event=i,this.low=t,this.high=e,this.max=this.high,this._left=null,this._right=null,this.parent=null,this.height=0};return e.prototype.insert=function(t){t.low<=this.low?null===this.left?this.left=t:this.left.insert(t):null===this.right?this.right=t:this.right.insert(t)},e.prototype.search=function(t,e){t>this.max||(null!==this.left&&this.left.search(t,e),this.low<=t&&this.high>t&&e.push(this),this.low>t||null!==this.right&&this.right.search(t,e))},e.prototype.searchAfter=function(t,e){this.low>=t&&(e.push(this),null!==this.left&&this.left.searchAfter(t,e)),null!==this.right&&this.right.searchAfter(t,e)},e.prototype.traverse=function(t){t(this),null!==this.left&&this.left.traverse(t),null!==this.right&&this.right.traverse(t)},e.prototype.updateHeight=function(){null!==this.left&&null!==this.right?this.height=Math.max(this.left.height,this.right.height)+1:null!==this.right?this.height=this.right.height+1:null!==this.left?this.height=this.left.height+1:this.height=0},e.prototype.updateMax=function(){this.max=this.high,null!==this.left&&(this.max=Math.max(this.max,this.left.max)),null!==this.right&&(this.max=Math.max(this.max,this.right.max))},e.prototype.getBalance=function(){var t=0;return null!==this.left&&null!==this.right?t=this.left.height-this.right.height:null!==this.left?t=this.left.height+1:null!==this.right&&(t=-(this.right.height+1)),t},e.prototype.isLeftChild=function(){return null!==this.parent&&this.parent.left===this},Object.defineProperty(e.prototype,"left",{get:function(){return this._left},set:function(t){this._left=t,null!==t&&(t.parent=this),this.updateHeight(),this.updateMax()}}),Object.defineProperty(e.prototype,"right",{get:function(){return this._right},set:function(t){this._right=t,null!==t&&(t.parent=this),this.updateHeight(),this.updateMax()}}),e.prototype.dispose=function(){this.parent=null,this._left=null,this._right=null,this.event=null},t.IntervalTimeline}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1)],void 0===(o=function(t){function e(t){return function(e,i){i=this.toSeconds(i),t.apply(this,arguments);var n=this._events.get(i),o=this._events.previousEvent(n),s=this._getTicksUntilEvent(o,i);return n.ticks=Math.max(s,0),this}}return t.TickSignal=function(e){e=t.defaultArg(e,1),t.Signal.call(this,{units:t.Type.Ticks,value:e}),this._events.memory=1/0,this.cancelScheduledValues(0),this._events.add({type:t.Param.AutomationType.SetValue,time:0,value:e})},t.extend(t.TickSignal,t.Signal),t.TickSignal.prototype.setValueAtTime=e(t.Signal.prototype.setValueAtTime),t.TickSignal.prototype.linearRampToValueAtTime=e(t.Signal.prototype.linearRampToValueAtTime),t.TickSignal.prototype.setTargetAtTime=function(t,e,i){e=this.toSeconds(e),this.setRampPoint(e),t=this._fromUnits(t);for(var n=this._events.get(e),o=Math.round(Math.max(1/i,1)),s=0;s<=o;s++){var r=i*s+e,a=this._exponentialApproach(n.time,n.value,t,i,r);this.linearRampToValueAtTime(this._toUnits(a),r)}return this},t.TickSignal.prototype.exponentialRampToValueAtTime=function(t,e){e=this.toSeconds(e),t=this._fromUnits(t);var i=this._events.get(e);null===i&&(i={value:this._initialValue,time:0});for(var n=Math.round(Math.max(10*(e-i.time),1)),o=(e-i.time)/n,s=0;s<=n;s++){var r=o*s+i.time,a=this._exponentialInterpolate(i.time,i.value,e,t,r);this.linearRampToValueAtTime(this._toUnits(a),r)}return this},t.TickSignal.prototype._getTicksUntilEvent=function(e,i){if(null===e)e={ticks:0,time:0};else if(t.isUndef(e.ticks)){var n=this._events.previousEvent(e);e.ticks=this._getTicksUntilEvent(n,e.time)}var o=this.getValueAtTime(e.time),s=this.getValueAtTime(i);return this._events.get(i).time===i&&this._events.get(i).type===t.Param.AutomationType.SetValue&&(s=this.getValueAtTime(i-this.sampleTime)),.5*(i-e.time)*(o+s)+e.ticks},t.TickSignal.prototype.getTicksAtTime=function(t){t=this.toSeconds(t);var e=this._events.get(t);return Math.max(this._getTicksUntilEvent(e,t),0)},t.TickSignal.prototype.getDurationOfTicks=function(t,e){e=this.toSeconds(e);var i=this.getTicksAtTime(e);return this.getTimeOfTick(i+t)-e},t.TickSignal.prototype.getTimeOfTick=function(e){var i=this._events.get(e,"ticks"),n=this._events.getAfter(e,"ticks");if(i&&i.ticks===e)return i.time;if(i&&n&&n.type===t.Param.AutomationType.Linear&&i.value!==n.value){var o=this.getValueAtTime(i.time),s=(this.getValueAtTime(n.time)-o)/(n.time-i.time),r=Math.sqrt(Math.pow(o,2)-2*s*(i.ticks-e)),a=(-o+r)/s;return(a>0?a:(-o-r)/s)+i.time}return i?0===i.value?1/0:i.time+(e-i.ticks)/i.value:e/this._initialValue},t.TickSignal.prototype.ticksToTime=function(e,i){return i=this.toSeconds(i),new t.Time(this.getDurationOfTicks(e,i))},t.TickSignal.prototype.timeToTicks=function(e,i){i=this.toSeconds(i),e=this.toSeconds(e);var n=this.getTicksAtTime(i),o=this.getTicksAtTime(i+e);return new t.Ticks(o-n)},t.TickSignal}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(56),i(33),i(35),i(20)],void 0===(o=function(t){"use strict";return t.Clock=function(){var e=t.defaults(arguments,["callback","frequency"],t.Clock);t.Emitter.call(this),this.callback=e.callback,this._nextTick=0,this._tickSource=new t.TickSource(e.frequency),this._lastUpdate=0,this.frequency=this._tickSource.frequency,this._readOnly("frequency"),this._state=new t.TimelineState(t.State.Stopped),this._state.setStateAtTime(t.State.Stopped,0),this._boundLoop=this._loop.bind(this),this.context.on("tick",this._boundLoop)},t.extend(t.Clock,t.Emitter),t.Clock.defaults={callback:t.noOp,frequency:1},Object.defineProperty(t.Clock.prototype,"state",{get:function(){return this._state.getValueAtTime(this.now())}}),t.Clock.prototype.start=function(e,i){return this.context.resume(),e=this.toSeconds(e),this._state.getValueAtTime(e)!==t.State.Started&&(this._state.setStateAtTime(t.State.Started,e),this._tickSource.start(e,i),e<this._lastUpdate&&this.emit("start",e,i)),this},t.Clock.prototype.stop=function(e){return e=this.toSeconds(e),this._state.cancel(e),this._state.setStateAtTime(t.State.Stopped,e),this._tickSource.stop(e),e<this._lastUpdate&&this.emit("stop",e),this},t.Clock.prototype.pause=function(e){return e=this.toSeconds(e),this._state.getValueAtTime(e)===t.State.Started&&(this._state.setStateAtTime(t.State.Paused,e),this._tickSource.pause(e),e<this._lastUpdate&&this.emit("pause",e)),this},Object.defineProperty(t.Clock.prototype,"ticks",{get:function(){return Math.ceil(this.getTicksAtTime(this.now()))},set:function(t){this._tickSource.ticks=t}}),Object.defineProperty(t.Clock.prototype,"seconds",{get:function(){return this._tickSource.seconds},set:function(t){this._tickSource.seconds=t}}),t.Clock.prototype.getSecondsAtTime=function(t){return this._tickSource.getSecondsAtTime(t)},t.Clock.prototype.setTicksAtTime=function(t,e){return this._tickSource.setTicksAtTime(t,e),this},t.Clock.prototype.getTicksAtTime=function(t){return this._tickSource.getTicksAtTime(t)},t.Clock.prototype.nextTickTime=function(t,e){e=this.toSeconds(e);var i=this.getTicksAtTime(e);return this._tickSource.getTimeOfTick(i+t,e)},t.Clock.prototype._loop=function(){var e=this._lastUpdate,i=this.now();this._lastUpdate=i,e!==i&&(this._state.forEachBetween(e,i,function(e){switch(e.state){case t.State.Started:var i=this._tickSource.getTicksAtTime(e.time);this.emit("start",e.time,i);break;case t.State.Stopped:0!==e.time&&this.emit("stop",e.time);break;case t.State.Paused:this.emit("pause",e.time)}}.bind(this)),this._tickSource.forEachTickBetween(e,i,function(t,e){this.callback(t,e)}.bind(this)))},t.Clock.prototype.getStateAtTime=function(t){return t=this.toSeconds(t),this._state.getValueAtTime(t)},t.Clock.prototype.dispose=function(){t.Emitter.prototype.dispose.call(this),this.context.off("tick",this._boundLoop),this._writable("frequency"),this._tickSource.dispose(),this._tickSource=null,this.frequency=null,this._boundLoop=null,this._nextTick=1/0,this.callback=null,this._state.dispose(),this._state=null},t.Clock}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(5),i(7)],void 0===(o=function(t){"use strict";return t.GreaterThanZero=function(){t.SignalBase.call(this),this._thresh=this.output=new t.WaveShaper(function(t){return t<=0?0:1},127),this._scale=this.input=new t.Multiply(1e4),this._scale.connect(this._thresh)},t.extend(t.GreaterThanZero,t.SignalBase),t.GreaterThanZero.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._scale.dispose(),this._scale=null,this._thresh.dispose(),this._thresh=null,this},t.GreaterThanZero}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(87),i(13),i(1)],void 0===(o=function(t){"use strict";return t.GreaterThan=function(e){t.Signal.call(this),this.createInsOuts(2,0),this._param=this.input[0]=new t.Subtract(e),this.input[1]=this._param.input[1],this._gtz=this.output=new t.GreaterThanZero,this._param.connect(this._gtz),this.proxy=!1},t.extend(t.GreaterThan,t.Signal),t.GreaterThan.prototype.dispose=function(){return t.Signal.prototype.dispose.call(this),this._gtz.dispose(),this._gtz=null,this},t.GreaterThan}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(47),i(26)],void 0===(o=function(t){"use strict";return t.ScaledEnvelope=function(){var e=t.defaults(arguments,["attack","decay","sustain","release"],t.Envelope);t.Envelope.call(this,e),e=t.defaultArg(e,t.ScaledEnvelope.defaults),this._exp=this.output=new t.Pow(e.exponent),this._scale=this.output=new t.Scale(e.min,e.max),this._sig.chain(this._exp,this._scale)},t.extend(t.ScaledEnvelope,t.Envelope),t.ScaledEnvelope.defaults={min:0,max:1,exponent:1},Object.defineProperty(t.ScaledEnvelope.prototype,"min",{get:function(){return this._scale.min},set:function(t){this._scale.min=t}}),Object.defineProperty(t.ScaledEnvelope.prototype,"max",{get:function(){return this._scale.max},set:function(t){this._scale.max=t}}),Object.defineProperty(t.ScaledEnvelope.prototype,"exponent",{get:function(){return this._exp.value},set:function(t){this._exp.value=t}}),t.ScaledEnvelope.prototype.dispose=function(){return t.Envelope.prototype.dispose.call(this),this._scale.dispose(),this._scale=null,this._exp.dispose(),this._exp=null,this},t.ScaledEnvelope}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(36)],void 0===(o=function(t){"use strict";return t.Abs=function(){t.SignalBase.call(this),this._abs=this.input=this.output=new t.WaveShaper(function(t){return Math.abs(t)<.001?0:Math.abs(t)},1024)},t.extend(t.Abs,t.SignalBase),t.Abs.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._abs.dispose(),this._abs=null,this},t.Abs}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(3),i(2)],void 0===(o=function(t){return t.Solo=function(){var e=t.defaults(arguments,["solo"],t.Solo);t.AudioNode.call(this),this.input=this.output=new t.Gain,this._soloBind=this._soloed.bind(this),this.context.on("solo",this._soloBind),this.solo=e.solo},t.extend(t.Solo,t.AudioNode),t.Solo.defaults={solo:!1},Object.defineProperty(t.Solo.prototype,"solo",{get:function(){return this._isSoloed()},set:function(t){t?this._addSolo():this._removeSolo(),this.context.emit("solo",this)}}),Object.defineProperty(t.Solo.prototype,"muted",{get:function(){return 0===this.input.gain.value}}),t.Solo.prototype._addSolo=function(){t.isArray(this.context._currentSolo)||(this.context._currentSolo=[]),this._isSoloed()||this.context._currentSolo.push(this)},t.Solo.prototype._removeSolo=function(){if(this._isSoloed()){var t=this.context._currentSolo.indexOf(this);this.context._currentSolo.splice(t,1)}},t.Solo.prototype._isSoloed=function(){return!!t.isArray(this.context._currentSolo)&&(0!==this.context._currentSolo.length&&-1!==this.context._currentSolo.indexOf(this))},t.Solo.prototype._noSolos=function(){return!t.isArray(this.context._currentSolo)||0===this.context._currentSolo.length},t.Solo.prototype._soloed=function(){this._isSoloed()?this.input.gain.value=1:this._noSolos()?this.input.gain.value=1:this.input.gain.value=0},t.Solo.prototype.dispose=function(){return this.context.off("solo",this._soloBind),this._removeSolo(),this._soloBind=null,t.AudioNode.prototype.dispose.call(this),this},t.Solo}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(10),i(28),i(19),i(3),i(1),i(20)],void 0===(o=function(t){if(t.supported&&!t.global.AudioContext.prototype.createStereoPanner){var e=function(e){this.context=e,this.pan=new t.Signal(0,t.Type.AudioRange);var i=new t.WaveShaper(function(e){return t.equalPowerScale((e+1)/2)},4096),n=new t.WaveShaper(function(e){return t.equalPowerScale(1-(e+1)/2)},4096),o=new t.Gain,s=new t.Gain,r=this.input=new t.Split;r._splitter.channelCountMode="explicit",(new t.Zero).fan(i,n);var a=this.output=new t.Merge;r.left.chain(o,a.left),r.right.chain(s,a.right),this.pan.chain(n,o.gain),this.pan.chain(i,s.gain)};e.prototype.disconnect=function(){this.output.disconnect.apply(this.output,arguments)},e.prototype.connect=function(){this.output.connect.apply(this.output,arguments)},AudioContext.prototype.createStereoPanner=function(){return new e(this)},t.Context.prototype.createStereoPanner=function(){return new e(this)}}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7)],void 0===(o=function(t){"use strict";return t.EqualPowerGain=function(){t.SignalBase.call(this),this._eqPower=this.input=this.output=new t.WaveShaper(function(e){return Math.abs(e)<.001?0:t.equalPowerScale(e)}.bind(this),4096)},t.extend(t.EqualPowerGain,t.SignalBase),t.EqualPowerGain.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._eqPower.dispose(),this._eqPower=null,this},t.EqualPowerGain}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(5),i(1)],void 0===(o=function(t){"use strict";return t.Negate=function(){t.SignalBase.call(this),this._multiply=this.input=this.output=new t.Multiply(-1)},t.extend(t.Negate,t.SignalBase),t.Negate.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._multiply.dispose(),this._multiply=null,this},t.Negate}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(60),i(27),i(2)],void 0===(o=function(t){"use strict";return t.PanVol=function(){var e=t.defaults(arguments,["pan","volume"],t.PanVol);t.AudioNode.call(this),this._panner=this.input=new t.Panner(e.pan),this.pan=this._panner.pan,this._volume=this.output=new t.Volume(e.volume),this.volume=this._volume.volume,this._panner.connect(this._volume),this.mute=e.mute,this._readOnly(["pan","volume"])},t.extend(t.PanVol,t.AudioNode),t.PanVol.defaults={pan:0,volume:0,mute:!1},Object.defineProperty(t.PanVol.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),t.PanVol.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["pan","volume"]),this._panner.dispose(),this._panner=null,this.pan=null,this._volume.dispose(),this._volume=null,this.volume=null,this},t.PanVol}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(34)],void 0===(o=function(t){t.supported&&(AnalyserNode.prototype.getFloatTimeDomainData||(AnalyserNode.prototype.getFloatTimeDomainData=function(t){var e=new Uint8Array(t.length);this.getByteTimeDomainData(e);for(var i=0;i<e.length;i++)t[i]=(e[i]-128)/128}))}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(34),i(63),i(20),i(3)],void 0===(o=function(t){if(t.supported&&!t.global.AudioContext.prototype.createConstantSource){var e=function(t){this.context=t;for(var e=t.createBuffer(1,128,t.sampleRate),i=e.getChannelData(0),n=0;n<i.length;n++)i[n]=1;this._bufferSource=t.createBufferSource(),this._bufferSource.channelCount=1,this._bufferSource.channelCountMode="explicit",this._bufferSource.buffer=e,this._bufferSource.loop=!0;var o=this._output=t.createGain();this.offset=o.gain,this._bufferSource.connect(o)};e.prototype.start=function(t){return this._bufferSource.start(t),this},e.prototype.stop=function(t){return this._bufferSource.stop(t),this},e.prototype.connect=function(){return this._output.connect.apply(this._output,arguments),this},e.prototype.disconnect=function(){return this._output.disconnect.apply(this._output,arguments),this},AudioContext.prototype.createConstantSource=function(){return new e(this)},t.Context.prototype.createConstantSource=function(){return new e(this)}}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(34)],void 0===(o=function(t){if(t.supported&&!t.global.AudioContext.prototype._native_createWaveShaper){var e=navigator.userAgent.toLowerCase();if(e.includes("safari")&&!e.includes("chrome")){var i=function(t){for(var e in this._internalNode=this.input=this.output=t._native_createWaveShaper(),this._curve=null,this._internalNode)this._defineProperty(this._internalNode,e)};Object.defineProperty(i.prototype,"curve",{get:function(){return this._curve},set:function(t){this._curve=t;var e=new Float32Array(t.length+1);e.set(t,1),e[0]=t[0],this._internalNode.curve=e}}),i.prototype._defineProperty=function(e,i){t.isUndef(this[i])&&Object.defineProperty(this,i,{get:function(){return"function"==typeof e[i]?e[i].bind(e):e[i]},set:function(t){e[i]=t}})},t.global.AudioContext.prototype._native_createWaveShaper=t.global.AudioContext.prototype.createWaveShaper,t.global.AudioContext.prototype.createWaveShaper=function(){return new i(this)}}}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(46)],void 0===(o=function(t){return t.Midi=function(e,i){if(!(this instanceof t.Midi))return new t.Midi(e,i);t.Frequency.call(this,e,i)},t.extend(t.Midi,t.Frequency),t.Midi.prototype._defaultUnits="midi",t.Midi.prototype._frequencyToUnits=function(e){return t.Frequency.ftom(t.Frequency.prototype._frequencyToUnits.call(this,e))},t.Midi.prototype._ticksToUnits=function(e){return t.Frequency.ftom(t.Frequency.prototype._ticksToUnits.call(this,e))},t.Midi.prototype._beatsToUnits=function(e){return t.Frequency.ftom(t.Frequency.prototype._beatsToUnits.call(this,e))},t.Midi.prototype._secondsToUnits=function(e){return t.Frequency.ftom(t.Frequency.prototype._secondsToUnits.call(this,e))},t.Midi.prototype.toMidi=function(){return this.valueOf()},t.Midi.prototype.toFrequency=function(){return t.Frequency.mtof(this.toMidi())},t.Midi.prototype.transpose=function(t){return new this.constructor(this.toMidi()+t)},t.Midi}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(27),i(2)],void 0===(o=function(t){"use strict";return t.UserMedia=function(){var e=t.defaults(arguments,["volume"],t.UserMedia);t.AudioNode.call(this),this._mediaStream=null,this._stream=null,this._device=null,this._volume=this.output=new t.Volume(e.volume),this.volume=this._volume.volume,this._readOnly("volume"),this.mute=e.mute},t.extend(t.UserMedia,t.AudioNode),t.UserMedia.defaults={volume:0,mute:!1},t.UserMedia.prototype.open=function(e){return this.state===t.State.Started&&this.close(),t.UserMedia.enumerateDevices().then(function(i){var n;if(t.isNumber(e))n=i[e];else if(!(n=i.find(function(t){return t.label===e||t.deviceId===e}))&&i.length>0)n=i[0];else if(!n&&t.isDefined(e))throw new Error("Tone.UserMedia: no matching device: "+e);this._device=n;var o={audio:{echoCancellation:!1,sampleRate:this.context.sampleRate,noiseSuppression:!1,mozNoiseSuppression:!1}};return n&&(o.audio.deviceId=n.deviceId),navigator.mediaDevices.getUserMedia(o).then(function(t){return this._stream||(this._stream=t,this._mediaStream=this.context.createMediaStreamSource(t),this._mediaStream.connect(this.output)),this}.bind(this))}.bind(this))},t.UserMedia.prototype.close=function(){return this._stream&&(this._stream.getAudioTracks().forEach(function(t){t.stop()}),this._stream=null,this._mediaStream.disconnect(),this._mediaStream=null),this._device=null,this},t.UserMedia.enumerateDevices=function(){return navigator.mediaDevices.enumerateDevices().then(function(t){return t.filter(function(t){return"audioinput"===t.kind})})},Object.defineProperty(t.UserMedia.prototype,"state",{get:function(){return this._stream&&this._stream.active?t.State.Started:t.State.Stopped}}),Object.defineProperty(t.UserMedia.prototype,"deviceId",{get:function(){if(this._device)return this._device.deviceId}}),Object.defineProperty(t.UserMedia.prototype,"groupId",{get:function(){if(this._device)return this._device.groupId}}),Object.defineProperty(t.UserMedia.prototype,"label",{get:function(){if(this._device)return this._device.label}}),Object.defineProperty(t.UserMedia.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),t.UserMedia.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.close(),this._writable("volume"),this._volume.dispose(),this._volume=null,this.volume=null,this},Object.defineProperty(t.UserMedia,"supported",{get:function(){return t.isDefined(navigator.mediaDevices)&&t.isFunction(navigator.mediaDevices.getUserMedia)}}),t.UserMedia}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(67),i(27),i(2)],void 0===(o=function(t){"use strict";return t.Players=function(e){var i=Array.prototype.slice.call(arguments);i.shift();var n=t.defaults(i,["onload"],t.Players);for(var o in t.AudioNode.call(this,n),this._volume=this.output=new t.Volume(n.volume),this.volume=this._volume.volume,this._readOnly("volume"),this._volume.output.output.channelCount=2,this._volume.output.output.channelCountMode="explicit",this.mute=n.mute,this._players={},this._loadingCount=0,this._fadeIn=n.fadeIn,this._fadeOut=n.fadeOut,e)this._loadingCount++,this.add(o,e[o],this._bufferLoaded.bind(this,n.onload))},t.extend(t.Players,t.AudioNode),t.Players.defaults={volume:0,mute:!1,onload:t.noOp,fadeIn:0,fadeOut:0},t.Players.prototype._bufferLoaded=function(t){this._loadingCount--,0===this._loadingCount&&t&&t(this)},Object.defineProperty(t.Players.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),Object.defineProperty(t.Players.prototype,"fadeIn",{get:function(){return this._fadeIn},set:function(t){this._fadeIn=t,this._forEach(function(e){e.fadeIn=t})}}),Object.defineProperty(t.Players.prototype,"fadeOut",{get:function(){return this._fadeOut},set:function(t){this._fadeOut=t,this._forEach(function(e){e.fadeOut=t})}}),Object.defineProperty(t.Players.prototype,"state",{get:function(){var e=!1;return this._forEach(function(i){e=e||i.state===t.State.Started}),e?t.State.Started:t.State.Stopped}}),t.Players.prototype.has=function(t){return this._players.hasOwnProperty(t)},t.Players.prototype.get=function(t){if(this.has(t))return this._players[t];throw new Error("Tone.Players: no player named "+t)},t.Players.prototype._forEach=function(t){for(var e in this._players)t(this._players[e],e);return this},Object.defineProperty(t.Players.prototype,"loaded",{get:function(){var t=!0;return this._forEach(function(e){t=t&&e.loaded}),t}}),t.Players.prototype.add=function(e,i,n){return this._players[e]=new t.Player(i,n).connect(this.output),this._players[e].fadeIn=this._fadeIn,this._players[e].fadeOut=this._fadeOut,this},t.Players.prototype.stopAll=function(t){this._forEach(function(e){e.stop(t)})},t.Players.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._volume.dispose(),this._volume=null,this._writable("volume"),this.volume=null,this.output=null,this._forEach(function(t){t.dispose()}),this._players=null,this},t.Players}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(11),i(31)],void 0===(o=function(t){return t.GrainPlayer=function(){var e=t.defaults(arguments,["url","onload"],t.GrainPlayer);t.Source.call(this,e),this.buffer=new t.Buffer(e.url,e.onload),this._clock=new t.Clock(this._tick.bind(this),e.grainSize),this._loopStart=0,this._loopEnd=0,this._activeSources=[],this._playbackRate=e.playbackRate,this._grainSize=e.grainSize,this._overlap=e.overlap,this.detune=e.detune,this.overlap=e.overlap,this.loop=e.loop,this.playbackRate=e.playbackRate,this.grainSize=e.grainSize,this.loopStart=e.loopStart,this.loopEnd=e.loopEnd,this.reverse=e.reverse,this._clock.on("stop",this._onstop.bind(this))},t.extend(t.GrainPlayer,t.Source),t.GrainPlayer.defaults={onload:t.noOp,overlap:.1,grainSize:.2,playbackRate:1,detune:0,loop:!1,loopStart:0,loopEnd:0,reverse:!1},t.GrainPlayer.prototype._start=function(e,i,n){i=t.defaultArg(i,0),i=this.toSeconds(i),e=this.toSeconds(e),this._offset=i,this._clock.start(e),n&&this.stop(e+this.toSeconds(n))},t.GrainPlayer.prototype._stop=function(t){this._clock.stop(t)},t.GrainPlayer.prototype._onstop=function(t){this._activeSources.forEach(function(e){e.fadeOut=0,e.stop(t)})},t.GrainPlayer.prototype._tick=function(e){if(!this.loop&&this._offset>this.buffer.duration)this.stop(e);else{var i=this._offset<this._overlap?0:this._overlap,n=new t.BufferSource({buffer:this.buffer,fadeIn:i,fadeOut:this._overlap,loop:this.loop,loopStart:this._loopStart,loopEnd:this._loopEnd,playbackRate:t.intervalToFrequencyRatio(this.detune/100)}).connect(this.output);n.start(e,this._offset),this._offset+=this.grainSize,n.stop(e+this.grainSize/this.playbackRate),this._activeSources.push(n),n.onended=function(){var t=this._activeSources.indexOf(n);-1!==t&&this._activeSources.splice(t,1)}.bind(this)}},Object.defineProperty(t.GrainPlayer.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(t){this._playbackRate=t,this.grainSize=this._grainSize}}),Object.defineProperty(t.GrainPlayer.prototype,"loopStart",{get:function(){return this._loopStart},set:function(t){this._loopStart=this.toSeconds(t)}}),Object.defineProperty(t.GrainPlayer.prototype,"loopEnd",{get:function(){return this._loopEnd},set:function(t){this._loopEnd=this.toSeconds(t)}}),Object.defineProperty(t.GrainPlayer.prototype,"reverse",{get:function(){return this.buffer.reverse},set:function(t){this.buffer.reverse=t}}),Object.defineProperty(t.GrainPlayer.prototype,"grainSize",{get:function(){return this._grainSize},set:function(t){this._grainSize=this.toSeconds(t),this._clock.frequency.value=this._playbackRate/this._grainSize}}),Object.defineProperty(t.GrainPlayer.prototype,"overlap",{get:function(){return this._overlap},set:function(t){this._overlap=this.toSeconds(t)}}),Object.defineProperty(t.GrainPlayer.prototype,"loaded",{get:function(){return this.buffer.loaded}}),t.GrainPlayer.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this.buffer.dispose(),this.buffer=null,this._clock.dispose(),this._clock=null,this._activeSources.forEach(function(t){t.dispose()}),this._activeSources=null,this},t.GrainPlayer}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(16),i(1),i(45)],void 0===(o=function(t){return t.TransportTimelineSignal=function(){t.Signal.apply(this,arguments),this.output=this._outputSig=new t.Signal(this._initialValue),this._lastVal=this.value,this._synced=t.Transport.scheduleRepeat(this._onTick.bind(this),"1i"),this._bindAnchorValue=this._anchorValue.bind(this),t.Transport.on("start stop pause",this._bindAnchorValue),this._events.memory=1/0},t.extend(t.TransportTimelineSignal,t.Signal),t.TransportTimelineSignal.prototype._onTick=function(e){var i=this.getValueAtTime(t.Transport.seconds);this._lastVal!==i&&(this._lastVal=i,this._outputSig.linearRampToValueAtTime(i,e))},t.TransportTimelineSignal.prototype._anchorValue=function(e){var i=this.getValueAtTime(t.Transport.seconds);return this._lastVal=i,this._outputSig.cancelScheduledValues(e),this._outputSig.setValueAtTime(i,e),this},t.TransportTimelineSignal.prototype.getValueAtTime=function(e){return e=t.TransportTime(e),t.Signal.prototype.getValueAtTime.call(this,e)},t.TransportTimelineSignal.prototype.setValueAtTime=function(e,i){return i=t.TransportTime(i),t.Signal.prototype.setValueAtTime.call(this,e,i),this},t.TransportTimelineSignal.prototype.linearRampToValueAtTime=function(e,i){return i=t.TransportTime(i),t.Signal.prototype.linearRampToValueAtTime.call(this,e,i),this},t.TransportTimelineSignal.prototype.exponentialRampToValueAtTime=function(e,i){return i=t.TransportTime(i),t.Signal.prototype.exponentialRampToValueAtTime.call(this,e,i),this},t.TransportTimelineSignal.prototype.setTargetAtTime=function(e,i,n){return i=t.TransportTime(i),t.Signal.prototype.setTargetAtTime.call(this,e,i,n),this},t.TransportTimelineSignal.prototype.cancelScheduledValues=function(e){return e=t.TransportTime(e),t.Signal.prototype.cancelScheduledValues.call(this,e),this},t.TransportTimelineSignal.prototype.setValueCurveAtTime=function(e,i,n,o){return i=t.TransportTime(i),n=t.TransportTime(n),t.Signal.prototype.setValueCurveAtTime.call(this,e,i,n,o),this},t.TransportTimelineSignal.prototype.cancelAndHoldAtTime=function(e){return t.Signal.prototype.cancelAndHoldAtTime.call(this,t.TransportTime(e))},t.TransportTimelineSignal.prototype.dispose=function(){t.Transport.clear(this._synced),t.Transport.off("start stop pause",this._syncedCallback),this._events.cancel(0),t.Signal.prototype.dispose.call(this),this._outputSig.dispose(),this._outputSig=null},t.TransportTimelineSignal}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(29),i(5)],void 0===(o=function(t){"use strict";return t.Normalize=function(e,i){t.SignalBase.call(this),this._inputMin=t.defaultArg(e,0),this._inputMax=t.defaultArg(i,1),this._sub=this.input=new t.Add(0),this._div=this.output=new t.Multiply(1),this._sub.connect(this._div),this._setRange()},t.extend(t.Normalize,t.SignalBase),Object.defineProperty(t.Normalize.prototype,"min",{get:function(){return this._inputMin},set:function(t){this._inputMin=t,this._setRange()}}),Object.defineProperty(t.Normalize.prototype,"max",{get:function(){return this._inputMax},set:function(t){this._inputMax=t,this._setRange()}}),t.Normalize.prototype._setRange=function(){this._sub.value=-this._inputMin,this._div.value=1/(this._inputMax-this._inputMin)},t.Normalize.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._sub.dispose(),this._sub=null,this._div.dispose(),this._div=null,this},t.Normalize}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(1)],void 0===(o=function(t){"use strict";return t.GainToAudio=function(){t.SignalBase.call(this),this._norm=this.input=this.output=new t.WaveShaper(function(t){return 2*Math.abs(t)-1})},t.extend(t.GainToAudio,t.SignalBase),t.GainToAudio.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._norm.dispose(),this._norm=null,this},t.GainToAudio}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){t.supported&&(OscillatorNode.prototype.setPeriodicWave||(OscillatorNode.prototype.setPeriodicWave=OscillatorNode.prototype.setWaveTable),AudioContext.prototype.createPeriodicWave||(AudioContext.prototype.createPeriodicWave=AudioContext.prototype.createWaveTable))}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(21),i(79),i(31)],void 0===(o=function(t){return t.Sampler=function(e){var i=Array.prototype.slice.call(arguments);i.shift();var n=t.defaults(i,["onload","baseUrl"],t.Sampler);t.Instrument.call(this,n);var o={};for(var s in e)if(t.isNote(s)){o[t.Frequency(s).toMidi()]=e[s]}else{if(isNaN(parseFloat(s)))throw new Error("Tone.Sampler: url keys must be the note's pitch");o[s]=e[s]}this._buffers=new t.Buffers(o,n.onload,n.baseUrl),this._activeSources={},this.attack=n.attack,this.release=n.release,this.curve=n.curve},t.extend(t.Sampler,t.Instrument),t.Sampler.defaults={attack:0,release:.1,onload:t.noOp,baseUrl:"",curve:"exponential"},t.Sampler.prototype._findClosest=function(t){for(var e=0;e<96;){if(this._buffers.has(t+e))return-e;if(this._buffers.has(t-e))return e;e++}return null},t.Sampler.prototype.triggerAttack=function(e,i,n){this.log("triggerAttack",e,i,n),Array.isArray(e)||(e=[e]);for(var o=0;o<e.length;o++){var s=t.Frequency(e[o]).toMidi(),r=this._findClosest(s);if(null!==r){var a=s-r,l=this._buffers.get(a),h=t.intervalToFrequencyRatio(r),u=new t.BufferSource({buffer:l,playbackRate:h,fadeIn:this.attack,fadeOut:this.release,curve:this.curve}).connect(this.output);u.start(i,0,l.duration/h,n),t.isArray(this._activeSources[s])||(this._activeSources[s]=[]),this._activeSources[s].push(u),u.onended=function(){if(this._activeSources&&this._activeSources[s]){var t=this._activeSources[s].indexOf(u);-1!==t&&this._activeSources[s].splice(t,1)}}.bind(this)}}return this},t.Sampler.prototype.triggerRelease=function(e,i){this.log("triggerRelease",e,i),Array.isArray(e)||(e=[e]);for(var n=0;n<e.length;n++){var o=t.Frequency(e[n]).toMidi();if(this._activeSources[o]&&this._activeSources[o].length){var s=this._activeSources[o].shift();i=this.toSeconds(i),s.stop(i)}}return this},t.Sampler.prototype.releaseAll=function(t){for(var e in t=this.toSeconds(t),this._activeSources)for(var i=this._activeSources[e];i.length;){i.shift().stop(t)}return this},t.Sampler.prototype.sync=function(){return this._syncMethod("triggerAttack",1),this._syncMethod("triggerRelease",1),this},t.Sampler.prototype.triggerAttackRelease=function(e,i,n,o){if(n=this.toSeconds(n),this.triggerAttack(e,n,o),t.isArray(i)&&t.isArray(e))for(var s=0;s<e.length;s++){var r=i[Math.min(s,i.length-1)];this.triggerRelease(e[s],n+this.toSeconds(r))}else this.triggerRelease(e,n+this.toSeconds(i));return this},t.Sampler.prototype.add=function(e,i,n){if(t.isNote(e)){var o=t.Frequency(e).toMidi();this._buffers.add(o,i,n)}else{if(isNaN(parseFloat(e)))throw new Error("Tone.Sampler: note must be the note's pitch. Instead got "+e);this._buffers.add(e,i,n)}},Object.defineProperty(t.Sampler.prototype,"loaded",{get:function(){return this._buffers.loaded}}),t.Sampler.prototype.dispose=function(){for(var e in t.Instrument.prototype.dispose.call(this),this._buffers.dispose(),this._buffers=null,this._activeSources)this._activeSources[e].forEach(function(t){t.dispose()});return this._activeSources=null,this},t.Sampler}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(38),i(6)],void 0===(o=function(t){"use strict";return t.PolySynth=function(){var e=t.defaults(arguments,["polyphony","voice"],t.PolySynth);t.Instrument.call(this,e),(e=t.defaultArg(e,t.Instrument.defaults)).polyphony=Math.min(t.PolySynth.MAX_POLYPHONY,e.polyphony),this.voices=new Array(e.polyphony),this.assert(e.polyphony>0,"polyphony must be greater than 0"),this.detune=new t.Signal(e.detune,t.Type.Cents),this._readOnly("detune");for(var i=0;i<e.polyphony;i++){var n=new e.voice(arguments[2],arguments[3]);if(!(n instanceof t.Monophonic))throw new Error("Synth constructor must be instance of Tone.Monophonic");this.voices[i]=n,n.index=i,n.connect(this.output),n.hasOwnProperty("detune")&&this.detune.connect(n.detune)}},t.extend(t.PolySynth,t.Instrument),t.PolySynth.defaults={polyphony:4,volume:0,detune:0,voice:t.Synth},t.PolySynth.prototype._getClosestVoice=function(e,i){var n=this.voices.find(function(n){if(Math.abs(n.frequency.getValueAtTime(e)-t.Frequency(i))<1e-4&&n.getLevelAtTime(e)>1e-5)return n});return n||this.voices.slice().sort(function(t,i){var n=t.getLevelAtTime(e+this.blockTime),o=i.getLevelAtTime(e+this.blockTime);return n<1e-5&&(n=0),o<1e-5&&(o=0),n-o}.bind(this))[0]},t.PolySynth.prototype.triggerAttack=function(t,e,i){return Array.isArray(t)||(t=[t]),e=this.toSeconds(e),t.forEach(function(t){var n=this._getClosestVoice(e,t);n.triggerAttack(t,e,i),this.log("triggerAttack",n.index,t)}.bind(this)),this},t.PolySynth.prototype.triggerRelease=function(t,e){return Array.isArray(t)||(t=[t]),e=this.toSeconds(e),t.forEach(function(t){var i=this._getClosestVoice(e,t);this.log("triggerRelease",i.index,t),i.triggerRelease(e)}.bind(this)),this},t.PolySynth.prototype.triggerAttackRelease=function(e,i,n,o){if(n=this.toSeconds(n),this.triggerAttack(e,n,o),t.isArray(i)&&t.isArray(e))for(var s=0;s<e.length;s++){var r=i[Math.min(s,i.length-1)];this.triggerRelease(e[s],n+this.toSeconds(r))}else this.triggerRelease(e,n+this.toSeconds(i));return this},t.PolySynth.prototype.sync=function(){return this._syncMethod("triggerAttack",1),this._syncMethod("triggerRelease",1),this},t.PolySynth.prototype.set=function(t,e,i){for(var n=0;n<this.voices.length;n++)this.voices[n].set(t,e,i);return this},t.PolySynth.prototype.get=function(t){return this.voices[0].get(t)},t.PolySynth.prototype.releaseAll=function(t){return t=this.toSeconds(t),this.voices.forEach(function(e){e.triggerRelease(t)}),this},t.PolySynth.prototype.dispose=function(){return t.Instrument.prototype.dispose.call(this),this.voices.forEach(function(t){t.dispose()}),this._writable("detune"),this.detune.dispose(),this.detune=null,this.voices=null,this},t.PolySynth.MAX_POLYPHONY=20,t.PolySynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(21),i(39),i(53)],void 0===(o=function(t){"use strict";return t.PluckSynth=function(e){e=t.defaultArg(e,t.PluckSynth.defaults),t.Instrument.call(this,e),this._noise=new t.Noise("pink"),this.attackNoise=e.attackNoise,this._lfcf=new t.LowpassCombFilter({resonance:e.resonance,dampening:e.dampening}),this.resonance=this._lfcf.resonance,this.dampening=this._lfcf.dampening,this._noise.connect(this._lfcf),this._lfcf.connect(this.output),this._readOnly(["resonance","dampening"])},t.extend(t.PluckSynth,t.Instrument),t.PluckSynth.defaults={attackNoise:1,dampening:4e3,resonance:.7},t.PluckSynth.prototype.triggerAttack=function(t,e){t=this.toFrequency(t),e=this.toSeconds(e);var i=1/t;return this._lfcf.delayTime.setValueAtTime(i,e),this._noise.start(e),this._noise.stop(e+i*this.attackNoise),this},t.PluckSynth.prototype.dispose=function(){return t.Instrument.prototype.dispose.call(this),this._noise.dispose(),this._lfcf.dispose(),this._noise=null,this._lfcf=null,this._writable(["resonance","dampening"]),this.dampening=null,this.resonance=null,this},t.PluckSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(30),i(41),i(39),i(1),i(9),i(21)],void 0===(o=function(t){"use strict";return t.NoiseSynth=function(e){e=t.defaultArg(e,t.NoiseSynth.defaults),t.Instrument.call(this,e),this.noise=new t.Noise(e.noise),this.envelope=new t.AmplitudeEnvelope(e.envelope),this.noise.chain(this.envelope,this.output),this._readOnly(["noise","envelope"])},t.extend(t.NoiseSynth,t.Instrument),t.NoiseSynth.defaults={noise:{type:"white"},envelope:{attack:.005,decay:.1,sustain:0}},t.NoiseSynth.prototype.triggerAttack=function(t,e){return t=this.toSeconds(t),this.envelope.triggerAttack(t,e),this.noise.start(t),0===this.envelope.sustain&&this.noise.stop(t+this.envelope.attack+this.envelope.decay),this},t.NoiseSynth.prototype.triggerRelease=function(t){return this.envelope.triggerRelease(t),this.noise.stop(t+this.envelope.release),this},t.NoiseSynth.prototype.sync=function(){return this._syncMethod("triggerAttack",0),this._syncMethod("triggerRelease",0),this},t.NoiseSynth.prototype.triggerAttackRelease=function(t,e,i){return e=this.toSeconds(e),t=this.toSeconds(t),this.triggerAttack(e,i),this.triggerRelease(e+t),this},t.NoiseSynth.prototype.dispose=function(){return t.Instrument.prototype.dispose.call(this),this._writable(["noise","envelope"]),this.noise.dispose(),this.noise=null,this.envelope.dispose(),this.envelope=null,this},t.NoiseSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(21),i(48),i(9),i(41),i(30),i(3),i(26),i(5)],void 0===(o=function(t){var e=[1,1.483,1.932,2.546,2.63,3.897];return t.MetalSynth=function(i){i=t.defaultArg(i,t.MetalSynth.defaults),t.Instrument.call(this,i),this.frequency=new t.Signal(i.frequency,t.Type.Frequency),this._oscillators=[],this._freqMultipliers=[],this._amplitue=new t.Gain(0).connect(this.output),this._highpass=new t.Filter({type:"highpass",Q:-3.0102999566398125}).connect(this._amplitue),this._octaves=i.octaves,this._filterFreqScaler=new t.Scale(i.resonance,7e3),this.envelope=new t.Envelope({attack:i.envelope.attack,attackCurve:"linear",decay:i.envelope.decay,sustain:0,release:i.envelope.release}).chain(this._filterFreqScaler,this._highpass.frequency),this.envelope.connect(this._amplitue.gain);for(var n=0;n<e.length;n++){var o=new t.FMOscillator({type:"square",modulationType:"square",harmonicity:i.harmonicity,modulationIndex:i.modulationIndex});o.connect(this._highpass),this._oscillators[n]=o;var s=new t.Multiply(e[n]);this._freqMultipliers[n]=s,this.frequency.chain(s,o.frequency)}this.octaves=i.octaves},t.extend(t.MetalSynth,t.Instrument),t.MetalSynth.defaults={frequency:200,envelope:{attack:.001,decay:1.4,release:.2},harmonicity:5.1,modulationIndex:32,resonance:4e3,octaves:1.5},t.MetalSynth.prototype.triggerAttack=function(e,i){return e=this.toSeconds(e),i=t.defaultArg(i,1),this.envelope.triggerAttack(e,i),this._oscillators.forEach(function(t){t.start(e)}),0===this.envelope.sustain&&this._oscillators.forEach(function(t){t.stop(e+this.envelope.attack+this.envelope.decay)}.bind(this)),this},t.MetalSynth.prototype.triggerRelease=function(t){return t=this.toSeconds(t),this.envelope.triggerRelease(t),this._oscillators.forEach(function(e){e.stop(t+this.envelope.release)}.bind(this)),this},t.MetalSynth.prototype.sync=function(){return this._syncMethod("triggerAttack",0),this._syncMethod("triggerRelease",0),this},t.MetalSynth.prototype.triggerAttackRelease=function(t,e,i){return e=this.toSeconds(e),t=this.toSeconds(t),this.triggerAttack(e,i),this.triggerRelease(e+t),this},Object.defineProperty(t.MetalSynth.prototype,"modulationIndex",{get:function(){return this._oscillators[0].modulationIndex.value},set:function(t){for(var e=0;e<this._oscillators.length;e++)this._oscillators[e].modulationIndex.value=t}}),Object.defineProperty(t.MetalSynth.prototype,"harmonicity",{get:function(){return this._oscillators[0].harmonicity.value},set:function(t){for(var e=0;e<this._oscillators.length;e++)this._oscillators[e].harmonicity.value=t}}),Object.defineProperty(t.MetalSynth.prototype,"resonance",{get:function(){return this._filterFreqScaler.min},set:function(t){this._filterFreqScaler.min=t,this.octaves=this._octaves}}),Object.defineProperty(t.MetalSynth.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t,this._filterFreqScaler.max=this._filterFreqScaler.min*Math.pow(2,t)}}),t.MetalSynth.prototype.dispose=function(){t.Instrument.prototype.dispose.call(this);for(var e=0;e<this._oscillators.length;e++)this._oscillators[e].dispose(),this._freqMultipliers[e].dispose();this._oscillators=null,this._freqMultipliers=null,this.frequency.dispose(),this.frequency=null,this._filterFreqScaler.dispose(),this._filterFreqScaler=null,this._amplitue.dispose(),this._amplitue=null,this.envelope.dispose(),this.envelope=null,this._highpass.dispose(),this._highpass=null},t.MetalSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(37),i(21),i(30)],void 0===(o=function(t){"use strict";return t.MembraneSynth=function(e){e=t.defaultArg(e,t.MembraneSynth.defaults),t.Instrument.call(this,e),this.oscillator=new t.OmniOscillator(e.oscillator),this.envelope=new t.AmplitudeEnvelope(e.envelope),this.octaves=e.octaves,this.pitchDecay=e.pitchDecay,this.oscillator.chain(this.envelope,this.output),this._readOnly(["oscillator","envelope"])},t.extend(t.MembraneSynth,t.Instrument),t.MembraneSynth.defaults={pitchDecay:.05,octaves:10,oscillator:{type:"sine"},envelope:{attack:.001,decay:.4,sustain:.01,release:1.4,attackCurve:"exponential"}},t.MembraneSynth.prototype.triggerAttack=function(t,e,i){e=this.toSeconds(e);var n=(t=this.toFrequency(t))*this.octaves;return this.oscillator.frequency.setValueAtTime(n,e),this.oscillator.frequency.exponentialRampToValueAtTime(t,e+this.toSeconds(this.pitchDecay)),this.envelope.triggerAttack(e,i),this.oscillator.start(e),0===this.envelope.sustain&&this.oscillator.stop(e+this.envelope.attack+this.envelope.decay),this},t.MembraneSynth.prototype.triggerRelease=function(t){return t=this.toSeconds(t),this.envelope.triggerRelease(t),this.oscillator.stop(t+this.envelope.release),this},t.MembraneSynth.prototype.dispose=function(){return t.Instrument.prototype.dispose.call(this),this._writable(["oscillator","envelope"]),this.oscillator.dispose(),this.oscillator=null,this.envelope.dispose(),this.envelope=null,this},t.MembraneSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(38),i(1),i(5),i(25)],void 0===(o=function(t){"use strict";return t.FMSynth=function(e){e=t.defaultArg(e,t.FMSynth.defaults),t.Monophonic.call(this,e),this._carrier=new t.Synth(e.carrier),this._carrier.volume.value=-10,this.oscillator=this._carrier.oscillator,this.envelope=this._carrier.envelope.set(e.envelope),this._modulator=new t.Synth(e.modulator),this._modulator.volume.value=-10,this.modulation=this._modulator.oscillator.set(e.modulation),this.modulationEnvelope=this._modulator.envelope.set(e.modulationEnvelope),this.frequency=new t.Signal(440,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this.modulationIndex=new t.Multiply(e.modulationIndex),this.modulationIndex.units=t.Type.Positive,this._modulationNode=new t.Gain(0),this.frequency.connect(this._carrier.frequency),this.frequency.chain(this.harmonicity,this._modulator.frequency),this.frequency.chain(this.modulationIndex,this._modulationNode),this.detune.fan(this._carrier.detune,this._modulator.detune),this._modulator.connect(this._modulationNode.gain),this._modulationNode.connect(this._carrier.frequency),this._carrier.connect(this.output),this._readOnly(["frequency","harmonicity","modulationIndex","oscillator","envelope","modulation","modulationEnvelope","detune"])},t.extend(t.FMSynth,t.Monophonic),t.FMSynth.defaults={harmonicity:3,modulationIndex:10,detune:0,oscillator:{type:"sine"},envelope:{attack:.01,decay:.01,sustain:1,release:.5},modulation:{type:"square"},modulationEnvelope:{attack:.5,decay:0,sustain:1,release:.5}},t.FMSynth.prototype._triggerEnvelopeAttack=function(t,e){return t=this.toSeconds(t),this._carrier._triggerEnvelopeAttack(t,e),this._modulator._triggerEnvelopeAttack(t),this},t.FMSynth.prototype._triggerEnvelopeRelease=function(t){return t=this.toSeconds(t),this._carrier._triggerEnvelopeRelease(t),this._modulator._triggerEnvelopeRelease(t),this},t.FMSynth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["frequency","harmonicity","modulationIndex","oscillator","envelope","modulation","modulationEnvelope","detune"]),this._carrier.dispose(),this._carrier=null,this._modulator.dispose(),this._modulator=null,this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this.modulationIndex.dispose(),this.modulationIndex=null,this.harmonicity.dispose(),this.harmonicity=null,this._modulationNode.dispose(),this._modulationNode=null,this.oscillator=null,this.envelope=null,this.modulationEnvelope=null,this.modulation=null,this},t.FMSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(68),i(12),i(1),i(5),i(25),i(14)],void 0===(o=function(t){"use strict";return t.DuoSynth=function(e){e=t.defaultArg(e,t.DuoSynth.defaults),t.Monophonic.call(this,e),this.voice0=new t.MonoSynth(e.voice0),this.voice0.volume.value=-10,this.voice1=new t.MonoSynth(e.voice1),this.voice1.volume.value=-10,this._vibrato=new t.LFO(e.vibratoRate,-50,50),this._vibrato.start(),this.vibratoRate=this._vibrato.frequency,this._vibratoGain=new t.Gain(e.vibratoAmount,t.Type.Positive),this.vibratoAmount=this._vibratoGain.gain,this.frequency=new t.Signal(440,t.Type.Frequency),this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this.frequency.connect(this.voice0.frequency),this.frequency.chain(this.harmonicity,this.voice1.frequency),this._vibrato.connect(this._vibratoGain),this._vibratoGain.fan(this.voice0.detune,this.voice1.detune),this.voice0.connect(this.output),this.voice1.connect(this.output),this._readOnly(["voice0","voice1","frequency","vibratoAmount","vibratoRate"])},t.extend(t.DuoSynth,t.Monophonic),t.DuoSynth.defaults={vibratoAmount:.5,vibratoRate:5,harmonicity:1.5,voice0:{volume:-10,portamento:0,oscillator:{type:"sine"},filterEnvelope:{attack:.01,decay:0,sustain:1,release:.5},envelope:{attack:.01,decay:0,sustain:1,release:.5}},voice1:{volume:-10,portamento:0,oscillator:{type:"sine"},filterEnvelope:{attack:.01,decay:0,sustain:1,release:.5},envelope:{attack:.01,decay:0,sustain:1,release:.5}}},t.DuoSynth.prototype._triggerEnvelopeAttack=function(t,e){return t=this.toSeconds(t),this.voice0._triggerEnvelopeAttack(t,e),this.voice1._triggerEnvelopeAttack(t,e),this},t.DuoSynth.prototype._triggerEnvelopeRelease=function(t){return this.voice0._triggerEnvelopeRelease(t),this.voice1._triggerEnvelopeRelease(t),this},t.DuoSynth.prototype.getLevelAtTime=function(t){return(this.voice0.getLevelAtTime(t)+this.voice1.getLevelAtTime(t))/2},t.DuoSynth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["voice0","voice1","frequency","vibratoAmount","vibratoRate"]),this.voice0.dispose(),this.voice0=null,this.voice1.dispose(),this.voice1=null,this.frequency.dispose(),this.frequency=null,this._vibratoGain.dispose(),this._vibratoGain=null,this._vibrato=null,this.harmonicity.dispose(),this.harmonicity=null,this.vibratoAmount.dispose(),this.vibratoAmount=null,this.vibratoRate=null,this},t.DuoSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(38),i(1),i(5),i(25),i(22),i(3)],void 0===(o=function(t){"use strict";return t.AMSynth=function(e){e=t.defaultArg(e,t.AMSynth.defaults),t.Monophonic.call(this,e),this._carrier=new t.Synth,this._carrier.volume.value=-10,this.oscillator=this._carrier.oscillator.set(e.oscillator),this.envelope=this._carrier.envelope.set(e.envelope),this._modulator=new t.Synth,this._modulator.volume.value=-10,this.modulation=this._modulator.oscillator.set(e.modulation),this.modulationEnvelope=this._modulator.envelope.set(e.modulationEnvelope),this.frequency=new t.Signal(440,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this._modulationScale=new t.AudioToGain,this._modulationNode=new t.Gain,this.frequency.connect(this._carrier.frequency),this.frequency.chain(this.harmonicity,this._modulator.frequency),this.detune.fan(this._carrier.detune,this._modulator.detune),this._modulator.chain(this._modulationScale,this._modulationNode.gain),this._carrier.chain(this._modulationNode,this.output),this._readOnly(["frequency","harmonicity","oscillator","envelope","modulation","modulationEnvelope","detune"])},t.extend(t.AMSynth,t.Monophonic),t.AMSynth.defaults={harmonicity:3,detune:0,oscillator:{type:"sine"},envelope:{attack:.01,decay:.01,sustain:1,release:.5},modulation:{type:"square"},modulationEnvelope:{attack:.5,decay:0,sustain:1,release:.5}},t.AMSynth.prototype._triggerEnvelopeAttack=function(t,e){return t=this.toSeconds(t),this._carrier._triggerEnvelopeAttack(t,e),this._modulator._triggerEnvelopeAttack(t),this},t.AMSynth.prototype._triggerEnvelopeRelease=function(t){return this._carrier._triggerEnvelopeRelease(t),this._modulator._triggerEnvelopeRelease(t),this},t.AMSynth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["frequency","harmonicity","oscillator","envelope","modulation","modulationEnvelope","detune"]),this._carrier.dispose(),this._carrier=null,this._modulator.dispose(),this._modulator=null,this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this.harmonicity.dispose(),this.harmonicity=null,this._modulationScale.dispose(),this._modulationScale=null,this._modulationNode.dispose(),this._modulationNode=null,this.oscillator=null,this.envelope=null,this.modulationEnvelope=null,this.modulation=null,this},t.AMSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(72),i(16)],void 0===(o=function(t){"use strict";return t.Sequence=function(){var e=t.defaults(arguments,["callback","events","subdivision"],t.Sequence),i=e.events;if(delete e.events,t.Part.call(this,e),this._subdivision=this.toTicks(e.subdivision),t.isUndef(e.loopEnd)&&t.isDefined(i)&&(this._loopEnd=i.length*this._subdivision),this._loop=!0,t.isDefined(i))for(var n=0;n<i.length;n++)this.add(n,i[n])},t.extend(t.Sequence,t.Part),t.Sequence.defaults={subdivision:"4n"},Object.defineProperty(t.Sequence.prototype,"subdivision",{get:function(){return t.Ticks(this._subdivision).toSeconds()}}),t.Sequence.prototype.at=function(e,i){return t.isArray(i)&&this.remove(e),t.Part.prototype.at.call(this,this._indexTime(e),i)},t.Sequence.prototype.add=function(e,i){if(null===i)return this;if(t.isArray(i)){var n=Math.round(this._subdivision/i.length);i=new t.Sequence(this._tick.bind(this),i,t.Ticks(n))}return t.Part.prototype.add.call(this,this._indexTime(e),i),this},t.Sequence.prototype.remove=function(e,i){return t.Part.prototype.remove.call(this,this._indexTime(e),i),this},t.Sequence.prototype._indexTime=function(e){return e instanceof t.TransportTime?e:t.Ticks(e*this._subdivision+this.startOffset).toSeconds()},t.Sequence.prototype.dispose=function(){return t.Part.prototype.dispose.call(this),this},t.Sequence}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(73),i(80)],void 0===(o=function(t){return t.Pattern=function(){var e=t.defaults(arguments,["callback","values","pattern"],t.Pattern);t.Loop.call(this,e),this._pattern=new t.CtrlPattern({values:e.values,type:e.pattern,index:e.index})},t.extend(t.Pattern,t.Loop),t.Pattern.defaults={pattern:t.CtrlPattern.Type.Up,callback:t.noOp,values:[]},t.Pattern.prototype._tick=function(t){this.callback(t,this._pattern.value),this._pattern.next()},Object.defineProperty(t.Pattern.prototype,"index",{get:function(){return this._pattern.index},set:function(t){this._pattern.index=t}}),Object.defineProperty(t.Pattern.prototype,"values",{get:function(){return this._pattern.values},set:function(t){this._pattern.values=t}}),Object.defineProperty(t.Pattern.prototype,"value",{get:function(){return this._pattern.value}}),Object.defineProperty(t.Pattern.prototype,"pattern",{get:function(){return this._pattern.type},set:function(t){this._pattern.type=t}}),t.Pattern.prototype.dispose=function(){t.Loop.prototype.dispose.call(this),this._pattern.dispose(),this._pattern=null},t.Pattern}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(18),i(12)],void 0===(o=function(t){"use strict";return t.Vibrato=function(){var e=t.defaults(arguments,["frequency","depth"],t.Vibrato);t.Effect.call(this,e),this._delayNode=new t.Delay(0,e.maxDelay),this._lfo=new t.LFO({type:e.type,min:0,max:e.maxDelay,frequency:e.frequency,phase:-90}).start().connect(this._delayNode.delayTime),this.frequency=this._lfo.frequency,this.depth=this._lfo.amplitude,this.depth.value=e.depth,this._readOnly(["frequency","depth"]),this.effectSend.chain(this._delayNode,this.effectReturn)},t.extend(t.Vibrato,t.Effect),t.Vibrato.defaults={maxDelay:.005,frequency:5,depth:.1,type:"sine"},Object.defineProperty(t.Vibrato.prototype,"type",{get:function(){return this._lfo.type},set:function(t){this._lfo.type=t}}),t.Vibrato.prototype.dispose=function(){t.Effect.prototype.dispose.call(this),this._delayNode.dispose(),this._delayNode=null,this._lfo.dispose(),this._lfo=null,this._writable(["frequency","depth"]),this.frequency=null,this.depth=null},t.Vibrato}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(12),i(15)],void 0===(o=function(t){"use strict";return t.Tremolo=function(){var e=t.defaults(arguments,["frequency","depth"],t.Tremolo);t.StereoEffect.call(this,e),this._lfoL=new t.LFO({phase:e.spread,min:1,max:0}),this._lfoR=new t.LFO({phase:e.spread,min:1,max:0}),this._amplitudeL=new t.Gain,this._amplitudeR=new t.Gain,this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.depth=new t.Signal(e.depth,t.Type.NormalRange),this._readOnly(["frequency","depth"]),this.effectSendL.chain(this._amplitudeL,this.effectReturnL),this.effectSendR.chain(this._amplitudeR,this.effectReturnR),this._lfoL.connect(this._amplitudeL.gain),this._lfoR.connect(this._amplitudeR.gain),this.frequency.fan(this._lfoL.frequency,this._lfoR.frequency),this.depth.fan(this._lfoR.amplitude,this._lfoL.amplitude),this.type=e.type,this.spread=e.spread},t.extend(t.Tremolo,t.StereoEffect),t.Tremolo.defaults={frequency:10,type:"sine",depth:.5,spread:180},t.Tremolo.prototype.start=function(t){return this._lfoL.start(t),this._lfoR.start(t),this},t.Tremolo.prototype.stop=function(t){return this._lfoL.stop(t),this._lfoR.stop(t),this},t.Tremolo.prototype.sync=function(e){return this._lfoL.sync(e),this._lfoR.sync(e),t.Transport.syncSignal(this.frequency),this},t.Tremolo.prototype.unsync=function(){return this._lfoL.unsync(),this._lfoR.unsync(),t.Transport.unsyncSignal(this.frequency),this},Object.defineProperty(t.Tremolo.prototype,"type",{get:function(){return this._lfoL.type},set:function(t){this._lfoL.type=t,this._lfoR.type=t}}),Object.defineProperty(t.Tremolo.prototype,"spread",{get:function(){return this._lfoR.phase-this._lfoL.phase},set:function(t){this._lfoL.phase=90-t/2,this._lfoR.phase=t/2+90}}),t.Tremolo.prototype.dispose=function(){return t.StereoEffect.prototype.dispose.call(this),this._writable(["frequency","depth"]),this._lfoL.dispose(),this._lfoL=null,this._lfoR.dispose(),this._lfoR=null,this._amplitudeL.dispose(),this._amplitudeL=null,this._amplitudeR.dispose(),this._amplitudeR=null,this.frequency=null,this.depth=null,this},t.Tremolo}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(75),i(1),i(5),i(13)],void 0===(o=function(t){"use strict";return t.StereoWidener=function(){var e=t.defaults(arguments,["width"],t.StereoWidener);t.MidSideEffect.call(this,e),this.width=new t.Signal(e.width,t.Type.NormalRange),this._readOnly(["width"]),this._twoTimesWidthMid=new t.Multiply(2),this._twoTimesWidthSide=new t.Multiply(2),this._midMult=new t.Multiply,this._twoTimesWidthMid.connect(this._midMult,0,1),this.midSend.chain(this._midMult,this.midReturn),this._oneMinusWidth=new t.Subtract,this._oneMinusWidth.connect(this._twoTimesWidthMid),this.context.getConstant(1).connect(this._oneMinusWidth,0,0),this.width.connect(this._oneMinusWidth,0,1),this._sideMult=new t.Multiply,this.width.connect(this._twoTimesWidthSide),this._twoTimesWidthSide.connect(this._sideMult,0,1),this.sideSend.chain(this._sideMult,this.sideReturn)},t.extend(t.StereoWidener,t.MidSideEffect),t.StereoWidener.defaults={width:.5},t.StereoWidener.prototype.dispose=function(){return t.MidSideEffect.prototype.dispose.call(this),this._writable(["width"]),this.width.dispose(),this.width=null,this._midMult.dispose(),this._midMult=null,this._sideMult.dispose(),this._sideMult=null,this._twoTimesWidthMid.dispose(),this._twoTimesWidthMid=null,this._twoTimesWidthSide.dispose(),this._twoTimesWidthSide=null,this._oneMinusWidth.dispose(),this._oneMinusWidth=null,this},t.StereoWidener}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(15),i(32),i(3)],void 0===(o=function(t){"use strict";return t.StereoFeedbackEffect=function(){var e=t.defaults(arguments,["feedback"],t.FeedbackEffect);t.StereoEffect.call(this,e),this.feedback=new t.Signal(e.feedback,t.Type.NormalRange),this._feedbackL=new t.Gain,this._feedbackR=new t.Gain,this.effectReturnL.chain(this._feedbackL,this.effectSendL),this.effectReturnR.chain(this._feedbackR,this.effectSendR),this.feedback.fan(this._feedbackL.gain,this._feedbackR.gain),this._readOnly(["feedback"])},t.extend(t.StereoFeedbackEffect,t.StereoEffect),t.StereoFeedbackEffect.prototype.dispose=function(){return t.StereoEffect.prototype.dispose.call(this),this._writable(["feedback"]),this.feedback.dispose(),this.feedback=null,this._feedbackL.dispose(),this._feedbackL=null,this._feedbackR.dispose(),this._feedbackR=null,this},t.StereoFeedbackEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(78),i(9),i(10),i(39),i(3),i(76)],void 0===(o=function(t){"use strict";return t.Reverb=function(){var e=t.defaults(arguments,["decay"],t.Reverb);t.Effect.call(this,e),this._convolver=this.context.createConvolver(),this.decay=e.decay,this.preDelay=e.preDelay,this.connectEffect(this._convolver)},t.extend(t.Reverb,t.Effect),t.Reverb.defaults={decay:1.5,preDelay:.01},t.Reverb.prototype.generate=function(){return t.Offline(function(){var e=new t.Noise,i=new t.Noise,n=new t.Merge;e.connect(n.left),i.connect(n.right);var o=(new t.Gain).toMaster();n.connect(o),e.start(0),i.start(0),o.gain.setValueAtTime(0,0),o.gain.linearRampToValueAtTime(1,this.preDelay),o.gain.exponentialApproachValueAtTime(0,this.preDelay,this.decay-this.preDelay)}.bind(this),this.decay).then(function(t){return this._convolver.buffer=t.get(),this}.bind(this))},t.Reverb.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._convolver.disconnect(),this._convolver=null,this},t.Reverb}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(12),i(23),i(1),i(32),i(18)],void 0===(o=function(t){"use strict";return t.PitchShift=function(){var e=t.defaults(arguments,["pitch"],t.PitchShift);t.FeedbackEffect.call(this,e),this._frequency=new t.Signal(0),this._delayA=new t.Delay(0,1),this._lfoA=new t.LFO({min:0,max:.1,type:"sawtooth"}).connect(this._delayA.delayTime),this._delayB=new t.Delay(0,1),this._lfoB=new t.LFO({min:0,max:.1,type:"sawtooth",phase:180}).connect(this._delayB.delayTime),this._crossFade=new t.CrossFade,this._crossFadeLFO=new t.LFO({min:0,max:1,type:"triangle",phase:90}).connect(this._crossFade.fade),this._feedbackDelay=new t.Delay(e.delayTime),this.delayTime=this._feedbackDelay.delayTime,this._readOnly("delayTime"),this._pitch=e.pitch,this._windowSize=e.windowSize,this._delayA.connect(this._crossFade.a),this._delayB.connect(this._crossFade.b),this._frequency.fan(this._lfoA.frequency,this._lfoB.frequency,this._crossFadeLFO.frequency),this.effectSend.fan(this._delayA,this._delayB),this._crossFade.chain(this._feedbackDelay,this.effectReturn);var i=this.now();this._lfoA.start(i),this._lfoB.start(i),this._crossFadeLFO.start(i),this.windowSize=this._windowSize},t.extend(t.PitchShift,t.FeedbackEffect),t.PitchShift.defaults={pitch:0,windowSize:.1,delayTime:0,feedback:0},Object.defineProperty(t.PitchShift.prototype,"pitch",{get:function(){return this._pitch},set:function(e){this._pitch=e;var i=0;e<0?(this._lfoA.min=0,this._lfoA.max=this._windowSize,this._lfoB.min=0,this._lfoB.max=this._windowSize,i=t.intervalToFrequencyRatio(e-1)+1):(this._lfoA.min=this._windowSize,this._lfoA.max=0,this._lfoB.min=this._windowSize,this._lfoB.max=0,i=t.intervalToFrequencyRatio(e)-1),this._frequency.value=i*(1.2/this._windowSize)}}),Object.defineProperty(t.PitchShift.prototype,"windowSize",{get:function(){return this._windowSize},set:function(t){this._windowSize=this.toSeconds(t),this.pitch=this._pitch}}),t.PitchShift.prototype.dispose=function(){return t.FeedbackEffect.prototype.dispose.call(this),this._frequency.dispose(),this._frequency=null,this._delayA.disconnect(),this._delayA=null,this._delayB.disconnect(),this._delayB=null,this._lfoA.dispose(),this._lfoA=null,this._lfoB.dispose(),this._lfoB=null,this._crossFade.dispose(),this._crossFade=null,this._crossFadeLFO.dispose(),this._crossFadeLFO=null,this._writable("delayTime"),this._feedbackDelay.dispose(),this._feedbackDelay=null,this.delayTime=null,this},t.PitchShift}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(74),i(1),i(18)],void 0===(o=function(t){"use strict";return t.PingPongDelay=function(){var e=t.defaults(arguments,["delayTime","feedback"],t.PingPongDelay);t.StereoXFeedbackEffect.call(this,e),this._leftDelay=new t.Delay(0,e.maxDelayTime),this._rightDelay=new t.Delay(0,e.maxDelayTime),this._rightPreDelay=new t.Delay(0,e.maxDelayTime),this.delayTime=new t.Signal(e.delayTime,t.Type.Time),this.effectSendL.chain(this._leftDelay,this.effectReturnL),this.effectSendR.chain(this._rightPreDelay,this._rightDelay,this.effectReturnR),this.delayTime.fan(this._leftDelay.delayTime,this._rightDelay.delayTime,this._rightPreDelay.delayTime),this._feedbackLR.disconnect(),this._feedbackLR.connect(this._rightDelay),this._readOnly(["delayTime"])},t.extend(t.PingPongDelay,t.StereoXFeedbackEffect),t.PingPongDelay.defaults={delayTime:.25,maxDelayTime:1},t.PingPongDelay.prototype.dispose=function(){return t.StereoXFeedbackEffect.prototype.dispose.call(this),this._leftDelay.dispose(),this._leftDelay=null,this._rightDelay.dispose(),this._rightDelay=null,this._rightPreDelay.dispose(),this._rightPreDelay=null,this._writable(["delayTime"]),this.delayTime.dispose(),this.delayTime=null,this},t.PingPongDelay}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(12),i(9),i(15)],void 0===(o=function(t){"use strict";return t.Phaser=function(){var e=t.defaults(arguments,["frequency","octaves","baseFrequency"],t.Phaser);t.StereoEffect.call(this,e),this._lfoL=new t.LFO(e.frequency,0,1),this._lfoR=new t.LFO(e.frequency,0,1),this._lfoR.phase=180,this._baseFrequency=e.baseFrequency,this._octaves=e.octaves,this.Q=new t.Signal(e.Q,t.Type.Positive),this._filtersL=this._makeFilters(e.stages,this._lfoL,this.Q),this._filtersR=this._makeFilters(e.stages,this._lfoR,this.Q),this.frequency=this._lfoL.frequency,this.frequency.value=e.frequency,this.effectSendL.connect(this._filtersL[0]),this.effectSendR.connect(this._filtersR[0]),this._filtersL[e.stages-1].connect(this.effectReturnL),this._filtersR[e.stages-1].connect(this.effectReturnR),this._lfoL.frequency.connect(this._lfoR.frequency),this.baseFrequency=e.baseFrequency,this.octaves=e.octaves,this._lfoL.start(),this._lfoR.start(),this._readOnly(["frequency","Q"])},t.extend(t.Phaser,t.StereoEffect),t.Phaser.defaults={frequency:.5,octaves:3,stages:10,Q:10,baseFrequency:350},t.Phaser.prototype._makeFilters=function(e,i,n){for(var o=new Array(e),s=0;s<e;s++){var r=this.context.createBiquadFilter();r.type="allpass",n.connect(r.Q),i.connect(r.frequency),o[s]=r}return t.connectSeries.apply(t,o),o},Object.defineProperty(t.Phaser.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t;var e=this._baseFrequency*Math.pow(2,t);this._lfoL.max=e,this._lfoR.max=e}}),Object.defineProperty(t.Phaser.prototype,"baseFrequency",{get:function(){return this._baseFrequency},set:function(t){this._baseFrequency=t,this._lfoL.min=t,this._lfoR.min=t,this.octaves=this._octaves}}),t.Phaser.prototype.dispose=function(){t.StereoEffect.prototype.dispose.call(this),this._writable(["frequency","Q"]),this.Q.dispose(),this.Q=null,this._lfoL.dispose(),this._lfoL=null,this._lfoR.dispose(),this._lfoR=null;for(var e=0;e<this._filtersL.length;e++)this._filtersL[e].disconnect(),this._filtersL[e]=null;this._filtersL=null;for(var i=0;i<this._filtersR.length;i++)this._filtersR[i].disconnect(),this._filtersR[i]=null;return this._filtersR=null,this.frequency=null,this},t.Phaser}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(58),i(15),i(26)],void 0===(o=function(t){"use strict";var e=[.06748,.06404,.08212,.09004],i=[.773,.802,.753,.733],n=[347,113,37];return t.JCReverb=function(){var o=t.defaults(arguments,["roomSize"],t.JCReverb);t.StereoEffect.call(this,o),this.roomSize=new t.Signal(o.roomSize,t.Type.NormalRange),this._scaleRoomSize=new t.Scale(-.733,.197),this._allpassFilters=[],this._feedbackCombFilters=[];for(var s=0;s<n.length;s++){var r=this.context.createBiquadFilter();r.type="allpass",r.frequency.value=n[s],this._allpassFilters.push(r)}for(var a=0;a<e.length;a++){var l=new t.FeedbackCombFilter(e[a],.1);this._scaleRoomSize.connect(l.resonance),l.resonance.value=i[a],this._allpassFilters[this._allpassFilters.length-1].connect(l),a<e.length/2?l.connect(this.effectReturnL):l.connect(this.effectReturnR),this._feedbackCombFilters.push(l)}this.roomSize.connect(this._scaleRoomSize),t.connectSeries.apply(t,this._allpassFilters),this.effectSendL.connect(this._allpassFilters[0]),this.effectSendR.connect(this._allpassFilters[0]),this._readOnly(["roomSize"])},t.extend(t.JCReverb,t.StereoEffect),t.JCReverb.defaults={roomSize:.5},t.JCReverb.prototype.dispose=function(){t.StereoEffect.prototype.dispose.call(this);for(var e=0;e<this._allpassFilters.length;e++)this._allpassFilters[e].disconnect(),this._allpassFilters[e]=null;this._allpassFilters=null;for(var i=0;i<this._feedbackCombFilters.length;i++)this._feedbackCombFilters[i].dispose(),this._feedbackCombFilters[i]=null;return this._feedbackCombFilters=null,this._writable(["roomSize"]),this.roomSize.dispose(),this.roomSize=null,this._scaleRoomSize.dispose(),this._scaleRoomSize=null,this},t.JCReverb}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(53),i(15),i(1),i(19),i(10),i(42)],void 0===(o=function(t){"use strict";var e=[1557/44100,1617/44100,1491/44100,1422/44100,1277/44100,1356/44100,1188/44100,1116/44100],i=[225,556,441,341];return t.Freeverb=function(){var n=t.defaults(arguments,["roomSize","dampening"],t.Freeverb);t.StereoEffect.call(this,n),this.roomSize=new t.Signal(n.roomSize,t.Type.NormalRange),this.dampening=new t.Signal(n.dampening,t.Type.Frequency),this._combFilters=[],this._allpassFiltersL=[],this._allpassFiltersR=[];for(var o=0;o<i.length;o++){var s=this.context.createBiquadFilter();s.type="allpass",s.frequency.value=i[o],this._allpassFiltersL.push(s)}for(var r=0;r<i.length;r++){var a=this.context.createBiquadFilter();a.type="allpass",a.frequency.value=i[r],this._allpassFiltersR.push(a)}for(var l=0;l<e.length;l++){var h=new t.LowpassCombFilter(e[l]);l<e.length/2?this.effectSendL.chain(h,this._allpassFiltersL[0]):this.effectSendR.chain(h,this._allpassFiltersR[0]),this.roomSize.connect(h.resonance),this.dampening.connect(h.dampening),this._combFilters.push(h)}t.connectSeries.apply(t,this._allpassFiltersL),t.connectSeries.apply(t,this._allpassFiltersR),this._allpassFiltersL[this._allpassFiltersL.length-1].connect(this.effectReturnL),this._allpassFiltersR[this._allpassFiltersR.length-1].connect(this.effectReturnR),this._readOnly(["roomSize","dampening"])},t.extend(t.Freeverb,t.StereoEffect),t.Freeverb.defaults={roomSize:.7,dampening:3e3},t.Freeverb.prototype.dispose=function(){t.StereoEffect.prototype.dispose.call(this);for(var e=0;e<this._allpassFiltersL.length;e++)this._allpassFiltersL[e].disconnect(),this._allpassFiltersL[e]=null;this._allpassFiltersL=null;for(var i=0;i<this._allpassFiltersR.length;i++)this._allpassFiltersR[i].disconnect(),this._allpassFiltersR[i]=null;this._allpassFiltersR=null;for(var n=0;n<this._combFilters.length;n++)this._combFilters[n].dispose(),this._combFilters[n]=null;return this._combFilters=null,this._writable(["roomSize","dampening"]),this.roomSize.dispose(),this.roomSize=null,this.dampening.dispose(),this.dampening=null,this},t.Freeverb}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(32),i(1),i(18)],void 0===(o=function(t){"use strict";return t.FeedbackDelay=function(){var e=t.defaults(arguments,["delayTime","feedback"],t.FeedbackDelay);t.FeedbackEffect.call(this,e),this._delayNode=new t.Delay(e.delayTime,e.maxDelay),this.delayTime=this._delayNode.delayTime,this.connectEffect(this._delayNode),this._readOnly(["delayTime"])},t.extend(t.FeedbackDelay,t.FeedbackEffect),t.FeedbackDelay.defaults={delayTime:.25,maxDelay:1},t.FeedbackDelay.prototype.dispose=function(){return t.FeedbackEffect.prototype.dispose.call(this),this._delayNode.dispose(),this._delayNode=null,this._writable(["delayTime"]),this.delayTime=null,this},t.FeedbackDelay}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(7)],void 0===(o=function(t){"use strict";return t.Distortion=function(){var e=t.defaults(arguments,["distortion"],t.Distortion);t.Effect.call(this,e),this._shaper=new t.WaveShaper(4096),this._distortion=e.distortion,this.connectEffect(this._shaper),this.distortion=e.distortion,this.oversample=e.oversample},t.extend(t.Distortion,t.Effect),t.Distortion.defaults={distortion:.4,oversample:"none"},Object.defineProperty(t.Distortion.prototype,"distortion",{get:function(){return this._distortion},set:function(t){this._distortion=t;var e=100*t,i=Math.PI/180;this._shaper.setMap(function(t){return Math.abs(t)<.001?0:(3+e)*t*20*i/(Math.PI+e*Math.abs(t))})}}),Object.defineProperty(t.Distortion.prototype,"oversample",{get:function(){return this._shaper.oversample},set:function(t){this._shaper.oversample=t}}),t.Distortion.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._shaper.dispose(),this._shaper=null,this},t.Distortion}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(12),i(15),i(18)],void 0===(o=function(t){"use strict";return t.Chorus=function(){var e=t.defaults(arguments,["frequency","delayTime","depth"],t.Chorus);t.StereoEffect.call(this,e),this._depth=e.depth,this._delayTime=e.delayTime/1e3,this._lfoL=new t.LFO({frequency:e.frequency,min:0,max:1}),this._lfoR=new t.LFO({frequency:e.frequency,min:0,max:1,phase:180}),this._delayNodeL=new t.Delay,this._delayNodeR=new t.Delay,this.frequency=this._lfoL.frequency,this.effectSendL.chain(this._delayNodeL,this.effectReturnL),this.effectSendR.chain(this._delayNodeR,this.effectReturnR),this.effectSendL.connect(this.effectReturnL),this.effectSendR.connect(this.effectReturnR),this._lfoL.connect(this._delayNodeL.delayTime),this._lfoR.connect(this._delayNodeR.delayTime),this._lfoL.start(),this._lfoR.start(),this._lfoL.frequency.connect(this._lfoR.frequency),this.depth=this._depth,this.frequency.value=e.frequency,this.type=e.type,this._readOnly(["frequency"]),this.spread=e.spread},t.extend(t.Chorus,t.StereoEffect),t.Chorus.defaults={frequency:1.5,delayTime:3.5,depth:.7,type:"sine",spread:180},Object.defineProperty(t.Chorus.prototype,"depth",{get:function(){return this._depth},set:function(t){this._depth=t;var e=this._delayTime*t;this._lfoL.min=Math.max(this._delayTime-e,0),this._lfoL.max=this._delayTime+e,this._lfoR.min=Math.max(this._delayTime-e,0),this._lfoR.max=this._delayTime+e}}),Object.defineProperty(t.Chorus.prototype,"delayTime",{get:function(){return 1e3*this._delayTime},set:function(t){this._delayTime=t/1e3,this.depth=this._depth}}),Object.defineProperty(t.Chorus.prototype,"type",{get:function(){return this._lfoL.type},set:function(t){this._lfoL.type=t,this._lfoR.type=t}}),Object.defineProperty(t.Chorus.prototype,"spread",{get:function(){return this._lfoR.phase-this._lfoL.phase},set:function(t){this._lfoL.phase=90-t/2,this._lfoR.phase=t/2+90}}),t.Chorus.prototype.dispose=function(){return t.StereoEffect.prototype.dispose.call(this),this._lfoL.dispose(),this._lfoL=null,this._lfoR.dispose(),this._lfoR=null,this._delayNodeL.dispose(),this._delayNodeL=null,this._delayNodeR.dispose(),this._delayNodeR=null,this._writable("frequency"),this.frequency=null,this},t.Chorus}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(7)],void 0===(o=function(t){"use strict";return t.Chebyshev=function(){var e=t.defaults(arguments,["order"],t.Chebyshev);t.Effect.call(this,e),this._shaper=new t.WaveShaper(4096),this._order=e.order,this.connectEffect(this._shaper),this.order=e.order,this.oversample=e.oversample},t.extend(t.Chebyshev,t.Effect),t.Chebyshev.defaults={order:1,oversample:"none"},t.Chebyshev.prototype._getCoefficient=function(t,e,i){return i.hasOwnProperty(e)?i[e]:(i[e]=0===e?0:1===e?t:2*t*this._getCoefficient(t,e-1,i)-this._getCoefficient(t,e-2,i),i[e])},Object.defineProperty(t.Chebyshev.prototype,"order",{get:function(){return this._order},set:function(t){this._order=t;for(var e=new Array(4096),i=e.length,n=0;n<i;++n){var o=2*n/i-1;e[n]=0===o?0:this._getCoefficient(o,t,{})}this._shaper.curve=e}}),Object.defineProperty(t.Chebyshev.prototype,"oversample",{get:function(){return this._shaper.oversample},set:function(t){this._shaper.oversample=t}}),t.Chebyshev.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._shaper.dispose(),this._shaper=null,this},t.Chebyshev}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(13),i(77)],void 0===(o=function(t){"use strict";return t.BitCrusher=function(){var e=t.defaults(arguments,["bits"],t.BitCrusher);t.Effect.call(this,e);var i=1/Math.pow(2,e.bits-1);this._subtract=new t.Subtract,this._modulo=new t.Modulo(i),this._bits=e.bits,this.effectSend.fan(this._subtract,this._modulo),this._modulo.connect(this._subtract,0,1),this._subtract.connect(this.effectReturn)},t.extend(t.BitCrusher,t.Effect),t.BitCrusher.defaults={bits:4},Object.defineProperty(t.BitCrusher.prototype,"bits",{get:function(){return this._bits},set:function(t){this._bits=t;var e=1/Math.pow(2,t-1);this._modulo.value=e}}),t.BitCrusher.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._subtract.dispose(),this._subtract=null,this._modulo.dispose(),this._modulo=null,this},t.BitCrusher}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(57),i(42),i(8),i(9)],void 0===(o=function(t){"use strict";return t.AutoWah=function(){var e=t.defaults(arguments,["baseFrequency","octaves","sensitivity"],t.AutoWah);t.Effect.call(this,e),this.follower=new t.Follower(e.follower),this._sweepRange=new t.ScaleExp(0,1,.5),this._baseFrequency=e.baseFrequency,this._octaves=e.octaves,this._inputBoost=new t.Gain,this._bandpass=new t.Filter({rolloff:-48,frequency:0,Q:e.Q}),this._peaking=new t.Filter(0,"peaking"),this._peaking.gain.value=e.gain,this.gain=this._peaking.gain,this.Q=this._bandpass.Q,this.effectSend.chain(this._inputBoost,this.follower,this._sweepRange),this._sweepRange.connect(this._bandpass.frequency),this._sweepRange.connect(this._peaking.frequency),this.effectSend.chain(this._bandpass,this._peaking,this.effectReturn),this._setSweepRange(),this.sensitivity=e.sensitivity,this._readOnly(["gain","Q"])},t.extend(t.AutoWah,t.Effect),t.AutoWah.defaults={baseFrequency:100,octaves:6,sensitivity:0,Q:2,gain:2,follower:{attack:.3,release:.5}},Object.defineProperty(t.AutoWah.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t,this._setSweepRange()}}),Object.defineProperty(t.AutoWah.prototype,"baseFrequency",{get:function(){return this._baseFrequency},set:function(t){this._baseFrequency=t,this._setSweepRange()}}),Object.defineProperty(t.AutoWah.prototype,"sensitivity",{get:function(){return t.gainToDb(1/this._inputBoost.gain.value)},set:function(e){this._inputBoost.gain.value=1/t.dbToGain(e)}}),t.AutoWah.prototype._setSweepRange=function(){this._sweepRange.min=this._baseFrequency,this._sweepRange.max=Math.min(this._baseFrequency*Math.pow(2,this._octaves),this.context.sampleRate/2)},t.AutoWah.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this.follower.dispose(),this.follower=null,this._sweepRange.dispose(),this._sweepRange=null,this._bandpass.dispose(),this._bandpass=null,this._peaking.dispose(),this._peaking=null,this._inputBoost.dispose(),this._inputBoost=null,this._writable(["gain","Q"]),this.gain=null,this.Q=null,this},t.AutoWah}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(12),i(60)],void 0===(o=function(t){"use strict";return t.AutoPanner=function(){var e=t.defaults(arguments,["frequency"],t.AutoPanner);t.Effect.call(this,e),this._lfo=new t.LFO({frequency:e.frequency,amplitude:e.depth,min:-1,max:1}),this.depth=this._lfo.amplitude,this._panner=new t.Panner,this.frequency=this._lfo.frequency,this.connectEffect(this._panner),this._lfo.connect(this._panner.pan),this.type=e.type,this._readOnly(["depth","frequency"])},t.extend(t.AutoPanner,t.Effect),t.AutoPanner.defaults={frequency:1,type:"sine",depth:1},t.AutoPanner.prototype.start=function(t){return this._lfo.start(t),this},t.AutoPanner.prototype.stop=function(t){return this._lfo.stop(t),this},t.AutoPanner.prototype.sync=function(t){return this._lfo.sync(t),this},t.AutoPanner.prototype.unsync=function(){return this._lfo.unsync(),this},Object.defineProperty(t.AutoPanner.prototype,"type",{get:function(){return this._lfo.type},set:function(t){this._lfo.type=t}}),t.AutoPanner.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._lfo.dispose(),this._lfo=null,this._panner.dispose(),this._panner=null,this._writable(["depth","frequency"]),this.frequency=null,this.depth=null,this},t.AutoPanner}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(12),i(9)],void 0===(o=function(t){"use strict";return t.AutoFilter=function(){var e=t.defaults(arguments,["frequency","baseFrequency","octaves"],t.AutoFilter);t.Effect.call(this,e),this._lfo=new t.LFO({frequency:e.frequency,amplitude:e.depth}),this.depth=this._lfo.amplitude,this.frequency=this._lfo.frequency,this.filter=new t.Filter(e.filter),this._octaves=0,this.connectEffect(this.filter),this._lfo.connect(this.filter.frequency),this.type=e.type,this._readOnly(["frequency","depth"]),this.octaves=e.octaves,this.baseFrequency=e.baseFrequency},t.extend(t.AutoFilter,t.Effect),t.AutoFilter.defaults={frequency:1,type:"sine",depth:1,baseFrequency:200,octaves:2.6,filter:{type:"lowpass",rolloff:-12,Q:1}},t.AutoFilter.prototype.start=function(t){return this._lfo.start(t),this},t.AutoFilter.prototype.stop=function(t){return this._lfo.stop(t),this},t.AutoFilter.prototype.sync=function(t){return this._lfo.sync(t),this},t.AutoFilter.prototype.unsync=function(){return this._lfo.unsync(),this},Object.defineProperty(t.AutoFilter.prototype,"type",{get:function(){return this._lfo.type},set:function(t){this._lfo.type=t}}),Object.defineProperty(t.AutoFilter.prototype,"baseFrequency",{get:function(){return this._lfo.min},set:function(t){this._lfo.min=this.toFrequency(t),this.octaves=this._octaves}}),Object.defineProperty(t.AutoFilter.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t,this._lfo.max=this.baseFrequency*Math.pow(2,t)}}),t.AutoFilter.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._lfo.dispose(),this._lfo=null,this.filter.dispose(),this.filter=null,this._writable(["frequency","depth"]),this.frequency=null,this.depth=null,this},t.AutoFilter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(23),i(10),i(19),i(1),i(22),i(28)],void 0===(o=function(t){"use strict";t.Listener=function(){t.call(this),this._orientation=[0,0,0,0,0,0],this._position=[0,0,0],t.getContext(function(){this.set(e.defaults),this.context.listener=this}.bind(this))},t.extend(t.Listener),t.Listener.defaults={positionX:0,positionY:0,positionZ:0,forwardX:0,forwardY:0,forwardZ:1,upX:0,upY:1,upZ:0},t.Listener.prototype.isListener=!0,t.Listener.prototype._rampTimeConstant=.01,t.Listener.prototype.setPosition=function(t,e,i){if(this.context.rawContext.listener.positionX){var n=this.now();this.context.rawContext.listener.positionX.setTargetAtTime(t,n,this._rampTimeConstant),this.context.rawContext.listener.positionY.setTargetAtTime(e,n,this._rampTimeConstant),this.context.rawContext.listener.positionZ.setTargetAtTime(i,n,this._rampTimeConstant)}else this.context.rawContext.listener.setPosition(t,e,i);return this._position=Array.prototype.slice.call(arguments),this},t.Listener.prototype.setOrientation=function(t,e,i,n,o,s){if(this.context.rawContext.listener.forwardX){var r=this.now();this.context.rawContext.listener.forwardX.setTargetAtTime(t,r,this._rampTimeConstant),this.context.rawContext.listener.forwardY.setTargetAtTime(e,r,this._rampTimeConstant),this.context.rawContext.listener.forwardZ.setTargetAtTime(i,r,this._rampTimeConstant),this.context.rawContext.listener.upX.setTargetAtTime(n,r,this._rampTimeConstant),this.context.rawContext.listener.upY.setTargetAtTime(o,r,this._rampTimeConstant),this.context.rawContext.listener.upZ.setTargetAtTime(s,r,this._rampTimeConstant)}else this.context.rawContext.listener.setOrientation(t,e,i,n,o,s);return this._orientation=Array.prototype.slice.call(arguments),this},Object.defineProperty(t.Listener.prototype,"positionX",{set:function(t){this._position[0]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[0]}}),Object.defineProperty(t.Listener.prototype,"positionY",{set:function(t){this._position[1]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[1]}}),Object.defineProperty(t.Listener.prototype,"positionZ",{set:function(t){this._position[2]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[2]}}),Object.defineProperty(t.Listener.prototype,"forwardX",{set:function(t){this._orientation[0]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[0]}}),Object.defineProperty(t.Listener.prototype,"forwardY",{set:function(t){this._orientation[1]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[1]}}),Object.defineProperty(t.Listener.prototype,"forwardZ",{set:function(t){this._orientation[2]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[2]}}),Object.defineProperty(t.Listener.prototype,"upX",{set:function(t){this._orientation[3]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[3]}}),Object.defineProperty(t.Listener.prototype,"upY",{set:function(t){this._orientation[4]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[4]}}),Object.defineProperty(t.Listener.prototype,"upZ",{set:function(t){this._orientation[5]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[5]}}),t.Listener.prototype.dispose=function(){return this._orientation=null,this._position=null,this};var e=t.Listener;return t.Listener=new e,t.Context.on("init",function(i){i.listener&&i.listener.isListener?t.Listener=i.listener:t.Listener=new e}),t.Listener}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(24)],void 0===(o=function(t){"use strict";return t.Draw=function(){t.call(this),this._events=new t.Timeline,this.expiration=.25,this.anticipation=.008,this._boundDrawLoop=this._drawLoop.bind(this)},t.extend(t.Draw),t.Draw.prototype.schedule=function(t,e){return this._events.add({callback:t,time:this.toSeconds(e)}),1===this._events.length&&requestAnimationFrame(this._boundDrawLoop),this},t.Draw.prototype.cancel=function(t){return this._events.cancel(this.toSeconds(t)),this},t.Draw.prototype._drawLoop=function(){for(var e=t.context.currentTime;this._events.length&&this._events.peek().time-this.anticipation<=e;){var i=this._events.shift();e-i.time<=this.expiration&&i.callback()}this._events.length>0&&requestAnimationFrame(this._boundDrawLoop)},t.Draw=new t.Draw,t.Draw}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(3)],void 0===(o=function(t){"use strict";var e={};return t.prototype.send=function(i,n){e.hasOwnProperty(i)||(e[i]=this.context.createGain()),n=t.defaultArg(n,0);var o=new t.Gain(n,t.Type.Decibels);return this.connect(o),o.connect(e[i]),o},t.prototype.receive=function(t,i){return e.hasOwnProperty(t)||(e[t]=this.context.createGain()),e[t].connect(this,0,i),this},t.Context.on("init",function(t){t.buses?e=t.buses:(e={},t.buses=e)}),t}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4)],void 0===(o=function(t){"use strict";return t.CtrlRandom=function(){var e=t.defaults(arguments,["min","max"],t.CtrlRandom);t.call(this),this.min=e.min,this.max=e.max,this.integer=e.integer},t.extend(t.CtrlRandom),t.CtrlRandom.defaults={min:0,max:1,integer:!1},Object.defineProperty(t.CtrlRandom.prototype,"value",{get:function(){var t=this.toSeconds(this.min),e=this.toSeconds(this.max),i=Math.random(),n=i*t+(1-i)*e;return this.integer&&(n=Math.floor(n)),n}}),t.CtrlRandom}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){"use strict";return t.CtrlMarkov=function(e,i){t.call(this),this.values=t.defaultArg(e,{}),this.value=t.defaultArg(i,Object.keys(this.values)[0])},t.extend(t.CtrlMarkov),t.CtrlMarkov.prototype.next=function(){if(this.values.hasOwnProperty(this.value)){var e=this.values[this.value];if(t.isArray(e))for(var i=this._getProbDistribution(e),n=Math.random(),o=0,s=0;s<i.length;s++){var r=i[s];if(n>o&&n<o+r){var a=e[s];t.isObject(a)?this.value=a.value:this.value=a}o+=r}else this.value=e}return this.value},t.CtrlMarkov.prototype._getProbDistribution=function(e){for(var i=[],n=0,o=!1,s=0;s<e.length;s++){var r=e[s];t.isObject(r)?(o=!0,i[s]=r.probability):i[s]=1/e.length,n+=i[s]}if(o)for(var a=0;a<i.length;a++)i[a]=i[a]/n;return i},t.CtrlMarkov.prototype.dispose=function(){this.values=null},t.CtrlMarkov}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4)],void 0===(o=function(t){"use strict";return t.CtrlInterpolate=function(){var e=t.defaults(arguments,["values","index"],t.CtrlInterpolate);t.call(this),this.values=e.values,this.index=e.index},t.extend(t.CtrlInterpolate),t.CtrlInterpolate.defaults={index:0,values:[]},Object.defineProperty(t.CtrlInterpolate.prototype,"value",{get:function(){var t=this.index;t=Math.min(t,this.values.length-1);var e=Math.floor(t),i=this.values[e],n=this.values[Math.ceil(t)];return this._interpolate(t-e,i,n)}}),t.CtrlInterpolate.prototype._interpolate=function(e,i,n){if(t.isArray(i)){for(var o=[],s=0;s<i.length;s++)o[s]=this._interpolate(e,i[s],n[s]);return o}if(t.isObject(i)){var r={};for(var a in i)r[a]=this._interpolate(e,i[a],n[a]);return r}return(1-e)*(i=this._toNumber(i))+e*(n=this._toNumber(n))},t.CtrlInterpolate.prototype._toNumber=function(e){return t.isNumber(e)?e:this.toSeconds(e)},t.CtrlInterpolate.prototype.dispose=function(){this.values=null},t.CtrlInterpolate}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(44),i(2)],void 0===(o=function(t){return t.Waveform=function(){var e=t.defaults(arguments,["size"],t.Waveform);e.type=t.Analyser.Type.Waveform,t.AudioNode.call(this),this._analyser=this.input=this.output=new t.Analyser(e)},t.extend(t.Waveform,t.AudioNode),t.Waveform.defaults={size:1024},t.Waveform.prototype.getValue=function(){return this._analyser.getValue()},Object.defineProperty(t.Waveform.prototype,"size",{get:function(){return this._analyser.size},set:function(t){this._analyser.size=t}}),t.Waveform.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._analyser.dispose(),this._analyser=null},t.Waveform}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(23),i(10),i(19),i(1),i(22),i(28),i(2)],void 0===(o=function(t){"use strict";return t.Panner3D=function(){var e=t.defaults(arguments,["positionX","positionY","positionZ"],t.Panner3D);t.AudioNode.call(this),this._panner=this.input=this.output=this.context.createPanner(),this._panner.panningModel=e.panningModel,this._panner.maxDistance=e.maxDistance,this._panner.distanceModel=e.distanceModel,this._panner.coneOuterGain=e.coneOuterGain,this._panner.coneOuterAngle=e.coneOuterAngle,this._panner.coneInnerAngle=e.coneInnerAngle,this._panner.refDistance=e.refDistance,this._panner.rolloffFactor=e.rolloffFactor,this._orientation=[e.orientationX,e.orientationY,e.orientationZ],this._position=[e.positionX,e.positionY,e.positionZ],this.orientationX=e.orientationX,this.orientationY=e.orientationY,this.orientationZ=e.orientationZ,this.positionX=e.positionX,this.positionY=e.positionY,this.positionZ=e.positionZ},t.extend(t.Panner3D,t.AudioNode),t.Panner3D.defaults={positionX:0,positionY:0,positionZ:0,orientationX:0,orientationY:0,orientationZ:0,panningModel:"equalpower",maxDistance:1e4,distanceModel:"inverse",coneOuterGain:0,coneOuterAngle:360,coneInnerAngle:360,refDistance:1,rolloffFactor:1},t.Panner3D.prototype._rampTimeConstant=.01,t.Panner3D.prototype.setPosition=function(t,e,i){if(this._panner.positionX){var n=this.now();this._panner.positionX.setTargetAtTime(t,n,this._rampTimeConstant),this._panner.positionY.setTargetAtTime(e,n,this._rampTimeConstant),this._panner.positionZ.setTargetAtTime(i,n,this._rampTimeConstant)}else this._panner.setPosition(t,e,i);return this._position=Array.prototype.slice.call(arguments),this},t.Panner3D.prototype.setOrientation=function(t,e,i){if(this._panner.orientationX){var n=this.now();this._panner.orientationX.setTargetAtTime(t,n,this._rampTimeConstant),this._panner.orientationY.setTargetAtTime(e,n,this._rampTimeConstant),this._panner.orientationZ.setTargetAtTime(i,n,this._rampTimeConstant)}else this._panner.setOrientation(t,e,i);return this._orientation=Array.prototype.slice.call(arguments),this},Object.defineProperty(t.Panner3D.prototype,"positionX",{set:function(t){this._position[0]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[0]}}),Object.defineProperty(t.Panner3D.prototype,"positionY",{set:function(t){this._position[1]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[1]}}),Object.defineProperty(t.Panner3D.prototype,"positionZ",{set:function(t){this._position[2]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[2]}}),Object.defineProperty(t.Panner3D.prototype,"orientationX",{set:function(t){this._orientation[0]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[0]}}),Object.defineProperty(t.Panner3D.prototype,"orientationY",{set:function(t){this._orientation[1]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[1]}}),Object.defineProperty(t.Panner3D.prototype,"orientationZ",{set:function(t){this._orientation[2]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[2]}}),t.Panner3D._aliasProperty=function(e){Object.defineProperty(t.Panner3D.prototype,e,{set:function(t){this._panner[e]=t},get:function(){return this._panner[e]}})},t.Panner3D._aliasProperty("panningModel"),t.Panner3D._aliasProperty("refDistance"),t.Panner3D._aliasProperty("rolloffFactor"),t.Panner3D._aliasProperty("distanceModel"),t.Panner3D._aliasProperty("coneInnerAngle"),t.Panner3D._aliasProperty("coneOuterAngle"),t.Panner3D._aliasProperty("coneOuterGain"),t.Panner3D._aliasProperty("maxDistance"),t.Panner3D.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._panner.disconnect(),this._panner=null,this._orientation=null,this._position=null,this},t.Panner3D}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(59),i(43),i(2)],void 0===(o=function(t){"use strict";return t.MultibandCompressor=function(e){t.AudioNode.call(this),e=t.defaultArg(arguments,t.MultibandCompressor.defaults),this._splitter=this.input=new t.MultibandSplit({lowFrequency:e.lowFrequency,highFrequency:e.highFrequency}),this.lowFrequency=this._splitter.lowFrequency,this.highFrequency=this._splitter.highFrequency,this.output=new t.Gain,this.low=new t.Compressor(e.low),this.mid=new t.Compressor(e.mid),this.high=new t.Compressor(e.high),this._splitter.low.chain(this.low,this.output),this._splitter.mid.chain(this.mid,this.output),this._splitter.high.chain(this.high,this.output),this._readOnly(["high","mid","low","highFrequency","lowFrequency"])},t.extend(t.MultibandCompressor,t.AudioNode),t.MultibandCompressor.defaults={low:t.Compressor.defaults,mid:t.Compressor.defaults,high:t.Compressor.defaults,lowFrequency:250,highFrequency:2e3},t.MultibandCompressor.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._splitter.dispose(),this._writable(["high","mid","low","highFrequency","lowFrequency"]),this.low.dispose(),this.mid.dispose(),this.high.dispose(),this._splitter=null,this.low=null,this.mid=null,this.high=null,this.lowFrequency=null,this.highFrequency=null,this},t.MultibandCompressor}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(10),i(2)],void 0===(o=function(t){"use strict";return t.Mono=function(){t.AudioNode.call(this),this.createInsOuts(1,0),this._merge=this.output=new t.Merge,this.input.connect(this._merge,0,0),this.input.connect(this._merge,0,1)},t.extend(t.Mono,t.AudioNode),t.Mono.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._merge.dispose(),this._merge=null,this},t.Mono}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(52),i(51),i(43),i(2)],void 0===(o=function(t){"use strict";return t.MidSideCompressor=function(e){t.AudioNode.call(this),e=t.defaultArg(e,t.MidSideCompressor.defaults),this._midSideSplit=this.input=new t.MidSideSplit,this._midSideMerge=this.output=new t.MidSideMerge,this.mid=new t.Compressor(e.mid),this.side=new t.Compressor(e.side),this._midSideSplit.mid.chain(this.mid,this._midSideMerge.mid),this._midSideSplit.side.chain(this.side,this._midSideMerge.side),this._readOnly(["mid","side"])},t.extend(t.MidSideCompressor,t.AudioNode),t.MidSideCompressor.defaults={mid:{ratio:3,threshold:-24,release:.03,attack:.02,knee:16},side:{ratio:6,threshold:-30,release:.25,attack:.03,knee:10}},t.MidSideCompressor.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["mid","side"]),this.mid.dispose(),this.mid=null,this.side.dispose(),this.side=null,this._midSideSplit.dispose(),this._midSideSplit=null,this._midSideMerge.dispose(),this._midSideMerge=null,this},t.MidSideCompressor}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(44),i(2)],void 0===(o=function(t){"use strict";return t.Meter=function(){var e=t.defaults(arguments,["smoothing"],t.Meter);t.AudioNode.call(this),this.smoothing=e.smoothing,this._rms=0,this.input=this.output=this._analyser=new t.Analyser("waveform",256)},t.extend(t.Meter,t.AudioNode),t.Meter.defaults={smoothing:.8},t.Meter.prototype.getLevel=function(){for(var e=this._analyser.getValue(),i=0,n=0;n<e.length;n++){var o=e[n];i+=o*o}var s=Math.sqrt(i/e.length);return this._rms=Math.max(s,this._rms*this.smoothing),t.gainToDb(this._rms)},t.Meter.prototype.getValue=function(){return this._analyser.getValue()[0]},t.Meter.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._analyser.dispose(),this._analyser=null,this},t.Meter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(43),i(2)],void 0===(o=function(t){"use strict";return t.Limiter=function(){var e=t.defaults(arguments,["threshold"],t.Limiter);t.AudioNode.call(this),this._compressor=this.input=this.output=new t.Compressor({attack:.001,decay:.001,threshold:e.threshold}),this.threshold=this._compressor.threshold,this._readOnly("threshold")},t.extend(t.Limiter,t.AudioNode),t.Limiter.defaults={threshold:-12},t.Limiter.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._compressor.dispose(),this._compressor=null,this._writable("threshold"),this.threshold=null,this},t.Limiter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(57),i(88),i(2)],void 0===(o=function(t){"use strict";return t.Gate=function(){var e=t.defaults(arguments,["threshold","smoothing"],t.Gate);t.AudioNode.call(this),this.createInsOuts(1,1),this._follower=new t.Follower(e.smoothing),this._gt=new t.GreaterThan(t.dbToGain(e.threshold)),this.input.connect(this.output),this.input.chain(this._follower,this._gt,this.output.gain)},t.extend(t.Gate,t.AudioNode),t.Gate.defaults={smoothing:.1,threshold:-40},Object.defineProperty(t.Gate.prototype,"threshold",{get:function(){return t.gainToDb(this._gt.value)},set:function(e){this._gt.value=t.dbToGain(e)}}),Object.defineProperty(t.Gate.prototype,"smoothing",{get:function(){return this._follower.smoothing},set:function(t){this._follower.smoothing=t}}),t.Gate.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._follower.dispose(),this._gt.dispose(),this._follower=null,this._gt=null,this},t.Gate}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(44),i(2)],void 0===(o=function(t){return t.FFT=function(){var e=t.defaults(arguments,["size"],t.FFT);e.type=t.Analyser.Type.FFT,t.AudioNode.call(this),this._analyser=this.input=this.output=new t.Analyser(e)},t.extend(t.FFT,t.AudioNode),t.FFT.defaults={size:1024},t.FFT.prototype.getValue=function(){return this._analyser.getValue()},Object.defineProperty(t.FFT.prototype,"size",{get:function(){return this._analyser.size},set:function(t){this._analyser.size=t}}),t.FFT.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._analyser.dispose(),this._analyser=null},t.FFT}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(59),i(3),i(2)],void 0===(o=function(t){"use strict";return t.EQ3=function(){var e=t.defaults(arguments,["low","mid","high"],t.EQ3);t.AudioNode.call(this),this.output=new t.Gain,this._multibandSplit=this.input=new t.MultibandSplit({lowFrequency:e.lowFrequency,highFrequency:e.highFrequency}),this._lowGain=new t.Gain(e.low,t.Type.Decibels),this._midGain=new t.Gain(e.mid,t.Type.Decibels),this._highGain=new t.Gain(e.high,t.Type.Decibels),this.low=this._lowGain.gain,this.mid=this._midGain.gain,this.high=this._highGain.gain,this.Q=this._multibandSplit.Q,this.lowFrequency=this._multibandSplit.lowFrequency,this.highFrequency=this._multibandSplit.highFrequency,this._multibandSplit.low.chain(this._lowGain,this.output),this._multibandSplit.mid.chain(this._midGain,this.output),this._multibandSplit.high.chain(this._highGain,this.output),this._readOnly(["low","mid","high","lowFrequency","highFrequency"])},t.extend(t.EQ3,t.AudioNode),t.EQ3.defaults={low:0,mid:0,high:0,lowFrequency:400,highFrequency:2500},t.EQ3.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["low","mid","high","lowFrequency","highFrequency"]),this._multibandSplit.dispose(),this._multibandSplit=null,this.lowFrequency=null,this.highFrequency=null,this._lowGain.dispose(),this._lowGain=null,this._midGain.dispose(),this._midGain=null,this._highGain.dispose(),this._highGain=null,this.low=null,this.mid=null,this.high=null,this.Q=null,this},t.EQ3}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(95),i(91),i(2)],void 0===(o=function(t){return t.Channel=function(){var e=t.defaults(arguments,["volume","pan"],t.PanVol);t.AudioNode.call(this,e),this._solo=this.input=new t.Solo(e.solo),this._panVol=this.output=new t.PanVol({pan:e.pan,volume:e.volume,mute:e.mute}),this.pan=this._panVol.pan,this.volume=this._panVol.volume,this._solo.connect(this._panVol),this._readOnly(["pan","volume"])},t.extend(t.Channel,t.AudioNode),t.Channel.defaults={pan:0,volume:0,mute:!1,solo:!1},Object.defineProperty(t.Channel.prototype,"solo",{get:function(){return this._solo.solo},set:function(t){this._solo.solo=t}}),Object.defineProperty(t.Channel.prototype,"muted",{get:function(){return this._solo.muted||this.mute}}),Object.defineProperty(t.Channel.prototype,"mute",{get:function(){return this._panVol.mute},set:function(t){this._panVol.mute=t}}),t.Channel.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["pan","volume"]),this._panVol.dispose(),this._panVol=null,this.pan=null,this.volume=null,this._solo.dispose(),this._solo=null,this},t.Channel}.apply(e,n))||(t.exports=o)},function(t,e){t.exports="13.4.9"},function(t,e){var i;i=function(){return this}();try{i=i||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof window&&(i=window)}t.exports=i},function(t,e,i){i(30),i(44),i(152),i(43),i(23),i(47),i(151),i(58),i(150),i(9),i(57),i(41),i(149),i(12),i(148),i(53),i(10),i(147),i(146),i(51),i(52),i(145),i(144),i(59),i(60),i(143),i(95),i(89),i(91),i(19),i(27),i(142),i(141),i(140),i(80),i(139),i(2),i(11),i(79),i(138),i(86),i(20),i(18),i(137),i(35),i(3),i(84),i(136),i(40),i(78),i(62),i(14),i(24),i(33),i(16),i(55),i(83),i(135),i(134),i(133),i(132),i(131),i(130),i(76),i(129),i(8),i(128),i(32),i(127),i(126),i(75),i(125),i(124),i(123),i(122),i(15),i(121),i(120),i(74),i(119),i(118),i(50),i(73),i(72),i(117),i(116),i(115),i(114),i(113),i(21),i(112),i(111),i(25),i(68),i(110),i(109),i(108),i(107),i(38),i(96),i(81),i(34),i(63),i(97),i(66),i(106),i(92),i(98),i(90),i(29),i(22),i(93),i(105),i(88),i(87),i(77),i(5),i(94),i(104),i(61),i(26),i(42),i(1),i(36),i(13),i(85),i(103),i(7),i(28),i(70),i(31),i(69),i(48),i(102),i(39),i(37),i(17),i(82),i(67),i(101),i(49),i(71),i(6),i(56),i(100),i(46),i(99),i(54),i(65),i(64),i(45),i(4),t.exports=i(0)}])});

},{}],3:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

require('svg.js');

var _require = require('./util'),
    getScrollRatio = _require.getScrollRatio,
    getRandomF = _require.getRandomF,
    getRandomFP = _require.getRandomFP; // generate dots 


function genDots(num, minSize, maxSize) {
  var dots = Array(num).fill(null);
  return dots.map(function (_, i) {
    var winWidth = window.innerWidth;
    var size = getRandomFP(minSize, maxSize);
    var x = getRandomF(0, winWidth);
    var y = getRandomF(-300, window.innerHeight + 300) - 150;
    return canvas.circle(size).move(x, y).fill('#FFF');
  });
} // moves svgs elements according to scroll position & diameter


function move(svg) {
  if (Array.isArray(svg)) {
    svg.forEach(m);
    return;
  }

  m(svg);

  function m(svg) {
    requestAnimationFrame(function () {
      var winHeight = window.innerHeight;
      var sizeScale = svg.width() / 10;
      svg.transform({
        y: getScrollRatio() * winHeight * sizeScale
      }); // updatePath();
    });
  }
}

function updatePath() {
  requestAnimationFrame(function () {
    var ps = points();
    path.plot(ps).opacity(getScrollRatio() / 3);
  });
} // drawing


var canvas = SVG('drawing').size('100%', '100%');
var stars = genDots(500, 1, 10);
var bigStars = stars.filter(function (p) {
  return p.width() > 7;
}); // get positions of all the big stars

var points = function points() {
  return bigStars.map(function (p) {
    return [p.cx(), p.cy() + p.transform().y];
  });
};

var path = canvas.polygon(points()).stroke('#FFF').opacity(0.5).style('fill-opacity', '0'); // animate

document.addEventListener('scroll', function () {
  move(_toConsumableArray(stars));
  updatePath(); // console.log(path.node.attributes[1].nodeValue);
});
document.addEventListener('click', function () {
  var p = document.querySelector('#click-me');
  p && p.parentNode.removeChild(p);
});

},{"./util":5,"svg.js":1}],4:[function(require,module,exports){
"use strict";

var Tone = require('tone');

var _require = require('./util'),
    getScrollRatio = _require.getScrollRatio;

Tone.Transport.BPM = 88; //a 4 voice Synth

var synth = new Tone.PolySynth(4, Tone.Synth);
synth.set({
  detune: 20,
  envelope: {
    decay: 20,
    sustain: 5
  }
});
var bass = new Tone.Synth({
  oscillator: {
    type: 'sawtooth'
  },
  envelope: {
    attack: 1.5,
    sustain: 1,
    release: 1000
  }
});
var bassFilter = new Tone.Filter({
  frequency: 800,
  type: 'lowpass'
});
bass.chain(bassFilter, new Tone.Distortion({
  distortion: 0.5
}), new Tone.Volume(-12), Tone.Master);
bass.detune.value = -1200;
var filter = new Tone.Filter({
  frequency: 1000,
  type: 'lowpass',
  Q: 5
});
var phaser = new Tone.Phaser(0.2, 2);
phaser.set({
  wet: 0.5
});
synth.chain(new Tone.Volume(-36), new Tone.Vibrato(), phaser, filter, new Tone.JCReverb(), new Tone.Volume(-6), Tone.Master);
var chords = [["C3", "E3", "G3", "B3", "C4", "E4", "G4", "B4"], ["A2", "C3", "E3", "G3", "A3", "C4", "E4", "G4"], ["E2", "A3", "C3", "E3", "A4", "C4"]];
var currentChord = 0; // start audio
// Tone.context.resume().then(() => {
// synth.triggerAttack(["C4", "E4", "G4", "B4"]);
// });

document.addEventListener('scroll', function () {
  var scrollR = getScrollRatio();
  var nextFreq = Math.pow(scrollR, 3) * (5000 - 100) + 100;
  filter.frequency.rampTo(nextFreq, 0.05); // if (scrollR > 0.9 || scrollR < 0.1) {
  // Tone.context.resume().then(() => {
  // console.log("trigger attack");
  // synth.triggerAttack(["C4", "E4", "G4", "B4"]);
  // });
  // }
});
document.addEventListener('click', function () {
  Tone.context.resume().then(function () {
    console.log("trigger release", {
      currentChord: currentChord
    });
    synth.triggerRelease(chords[currentChord]);
    bass.triggerRelease();
    currentChord++;
    if (currentChord == chords.length) currentChord = 0;
    console.log("trigger attack", {
      currentChord: currentChord
    });
    synth.triggerAttack(chords[currentChord]);
    bass.triggerAttackRelease(chords[currentChord][0], '8n');
  });
});

},{"./util":5,"tone":2}],5:[function(require,module,exports){
"use strict";

module.exports = {
  getRandomF: function getRandomF(min, max) {
    return Math.random() * (max - min) + min;
  },
  getRandomFP: function getRandomFP(min, max) {
    var rand = Math.pow(Math.random(), 12);
    return rand * (max - min) + min;
  },
  getScrollRatio: function getScrollRatio() {
    var scrollTop = window.scrollY;
    var docHeight = document.body.offsetHeight;
    var winHeight = window.innerHeight;
    var scrollRatio = 1 - scrollTop / (docHeight - winHeight);
    return scrollRatio;
  }
};

},{}]},{},[4,3]);
