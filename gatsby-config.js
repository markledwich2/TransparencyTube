require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
    siteMetadata: {
        title: `transparency.tube`,
        description: `Daily stats for political YouTube`,
        author: ``,
    },
    plugins: [
        `gatsby-transformer-sharp`,
        `gatsby-plugin-sharp`,
        `gatsby-plugin-react-helmet`,
        `gatsby-plugin-styled-components`,
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                path: `${__dirname}/src/images`,
            },
        },
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                start_url: `/`,
                background_color: `#000`,
                theme_color: `#125C6E`,
                display: `standalone`,
                icon: 'static/ttube.svg'
            },
        },
        {
            resolve: `gatsby-plugin-google-gtag`,
            options: {
                trackingIds: [
                    "G-RNECEYKXK5"
                ]
            },
        },
        {
            resolve: `gatsby-plugin-create-client-paths`,
            options: { prefixes: [`/sandbox/narrative/*`] },
        },
        {
            resolve: 'gatsby-plugin-page-creator',
            options: {
                path: `${__dirname}/src/pages`,
                ignore: process.env.NODE_ENV === 'development' ? null : ['sandbox/*.tsx'],
            }
        }
    ],
    flags: {
        PRESERVE_WEBPACK_CACHE: true,
        FAST_DEV: true
    }
}