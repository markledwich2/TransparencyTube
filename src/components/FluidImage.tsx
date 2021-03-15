import { StaticQuery, graphql } from 'gatsby'
import GatsbyImage, { FluidObject } from 'gatsby-image'
import React from 'react'
import { last } from 'remeda'
import { uri } from '../common/Uri'
import { StyleProps } from './Style'


export const FluidImage = ({ path, style }: { path: string } & StyleProps) => <StaticQuery query={graphql`
query {
  allImageSharp {
    edges {
      node {
        fluid(maxWidth: 1200) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
}
`}

  render={data => <GatsbyImage style={style} fluid={data.allImageSharp.edges
    .map((e: { node: { fluid: FluidObject } }) => e.node.fluid)
    .find(f => path == last(f.src.split('/')))
  } />}
/>