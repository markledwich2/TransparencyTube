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
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                path: `${__dirname}/src/images`,
            },
        },
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `transparency.tube`,
                short_name: `transparency.tube`,
                start_url: `/`,
                background_color: `#000`,
                theme_color: `#125C6E`,
                display: `standalone`,
                icon: 'src/images/ttube.svg'
            },
        }
    ],
}