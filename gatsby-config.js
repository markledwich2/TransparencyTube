module.exports = {
    siteMetadata: {
        title: `transparency.tube`,
        description: `Daily stats for political YouTube`,
        author: ``,
    },
    plugins: [
        `gatsby-plugin-react-helmet`,
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `images`,
                path: `${__dirname}/src/images`,
            },
        },
    ],
}