import * as React from 'react'
import reactPrimitives from 'react-primitives'
import PropTypes from 'prop-types'

import { getStyles } from './getStyles'
import { convertToRNStyles } from './convertToRNStyles'

const primitives = ['Text', 'View', 'Image']

const isValidPrimitive = primitive => primitives.indexOf(primitive) > -1

// Validate and return the primitive
const getPrimitive = primitive => {
  if (typeof primitive === 'string' && isValidPrimitive(primitive)) {
    return reactPrimitives[primitive]
  } else if (typeof primitive === 'string' && !isValidPrimitive(primitive)) {
    throw new Error(
      `Cannot style invalid primitive ${primitive}. Expected primitive to be one of ['Text', 'View', 'Image']`
    )
  } else if (typeof primitive === 'function') {
    return primitive
  }
}

// Evaluate the styles and convert them to React Native using styled component context
function evalStyles(context, Comp, styles, styleOverrides) {
  // Assign static property so that the styles can be reused (like in withComponent)
  Comp.styles = convertToRNStyles.call(context, styles)

  return getStyles.call(context, Comp.styles, context.props, styleOverrides)
}

// Do not pass ref in stateless components
const shouldPassRef = (primitive, ref) => {
  if (typeof primitive !== 'string') {
    return typeof primitive.prototype.render !== 'undefined' ? { ref } : null
  }
}

/**
 * Creates a function that renders the styles on multiple targets with same code.
 */
export function createEmotionPrimitive(splitProps) {
  /*
   * Returns styled component
   */
  return function emotion(primitive) {
    return createStyledComponent

    /**
     * Create emotion styled component
     */
    function createStyledComponent() {
      let styles = []

      styles.push.apply(styles, arguments)

      class Styled extends React.Component {
        static propTypes = {
          innerRef: PropTypes.oneOfType([ PropTypes.func, PropTypes.object ])
        }

        onRef = node => {
          const { innerRef } = this.props

          if (typeof innerRef === 'function') {
            innerRef(node)
          } else if (typeof innerRef === 'object' && innerRef && innerRef.hasOwnProperty('current')) {
            innerRef.current = node
          }
        }

        render() {
          const { toForward, styleOverrides } = splitProps(
            primitive,
            this.props
          )

          const emotionStyles = evalStyles(this, Styled, styles, styleOverrides)

          return React.createElement(
            getPrimitive(primitive),
            {
              ...toForward,
              ...shouldPassRef(primitive, this.onRef),
              style: emotionStyles.length > 0 ? emotionStyles : {}
            }
          )
        }
      }

      Styled.primitive = primitive

      Styled.withComponent = newPrimitive =>
        emotion(getPrimitive(newPrimitive))(...Styled.styles)

      Object.assign(
        Styled,
        getStyledMetadata({
          primitive,
          styles
        })
      )

      return Styled
    }
  }
}

const getStyledMetadata = ({ primitive, styles }) => ({
  styles: primitive.styles ? primitive.styles.concat(styles) : styles,
  primitive: primitive.primitive ? primitive.primitive : primitive,
  displayName: `emotion(${getDisplayName(primitive)})`
})

const getDisplayName = primitive =>
  typeof primitive === 'string'
    ? primitive
    : primitive.displayName || primitive.name || 'Styled'