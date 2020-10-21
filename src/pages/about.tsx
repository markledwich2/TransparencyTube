import React from "react"

import Layout from "../components/Layout"
import { ChannelVideoViewsPage } from '../components/ChannelVideoViews'
import SEO from '../components/SEO'
import { Footer } from '../components/Footer'
import { Markdown } from '../components/Markdown'
import styled from 'styled-components'


const aboutMd = `## Transparency.tube - The First Comprehensive Look at Politics on YouTube

YouTube is used by [71% of Americans](https://www.journalism.org/2020/09/28/youtube-news-consumers-about-as-likely-to-use-the-site-for-opinions-as-for-facts/) and a source of news for [26% of US adults](https://www.journalism.org/2020/09/28/many-americans-get-news-on-youtube-where-news-organizations-and-independent-producers-thrive-side-by-side/). The platform is undoubtedly playing an important role in shaping America’s views on a range of political and cultural topics. While the impact of YouTube continues to grow, options for understanding the content and ideas being shared on the platform are lacking.

That is why we built Transparancy.tube. By categorizing, indexing, and analyzing over 8,000 of the largest English language YouTube channels actively discussing political and cultural issues, we aim to provide the data necessary to better understand this space.

The unfathomable amount of politically oriented content on YouTube, 1.9M videos in 2020 alone in our dataset, makes it impossible for any individual to fully comprehend what's occurring in a given moment. There has traditionally been an absence of reliable data when it comes to the internal and external workings of Youtube. Consequently, reporters have historically resorted to using anecdotal evidence and small sample sizes of videos when reporting on the platform. Further, some have continued to articulate narratives that have not kept pace with contemporary changes occurring on the YouTube platform, such as the updating of recommendation systems and the evolution of political content.

One solution for dealing with such a large amount of content is to leverage AI or Machine Learning. As one of the worldwide leaders in this domain, Google clearly has the ability to thoroughly analyze the political and cultural ideas being shared on YouTube. However, they have almost no incentive to.  YouTube has been the target of intense criticism from both the left and right. This criticism has centered on the content they allow on their platform and how this content is promoted through their recommendation system.  This has resulted in YouTube applying a very reticent approach to the data they share concerning hot button topics.

Transparency.tube fills this data vacuum to help journalists, researchers, and the curious better understand  YouTube’s political landscape. Our platform has created an interactive visualization of 8,162 channels that discuss political or cultural issues. This includes views and estimated watch time data for the approximately 9.3M videos posted by these channels.  Along with classifying each channel’s political leaning as left, center, or right, we go a step further and assign one or more of 14 different fine grained tags to each channel.  This enables a view into a number of the niche communities that YouTube has fostered.

Channels represented on Transparency.tube must have over 10K subscribers and target english speaking countries. They were found as follows:
*   ~800 channels were manually tagged by three or more reviewers as part of prior work completed by Mark Ledwich and Anna Zaitsev to study YouTube’s recommendation algorithm. The tags defined in this study were chosen to account for the significant cultural discussions that accompany traditional political discussions on the platform. This work, along with further descriptions of the tags, can be found [here](https://github.com/markledwich2/Recfluence).
*   ~7,300 channels were discovered and tagged using a machine learning approach developed by Sam Clark that leverages subscription information of commenters. This involved identifying political channels from a set of 12.6M total channels. This work is documented [here](https://github.com/sam-clark/chan2vec) and the accuracy of the method compares favorably to the manual review of channels.


The [transparency.tube](https://transparency.tube/) home page presents a window into political-YouTube with a **Channel Bubbles** visualization. By default, the size of each channel bubble represents views for the selected period, it gives an easy to grasp overview and the ability to dig into granular detail. There are a variety of options to filter and group (shown below). For example, different sized channels by total watch-time, or a historic look back to viewership and follower statistics for a particular moment in time.

![channel bubble visualization](/about/ttube-bubbles.gif)


Below is the **Top Videos List**, which shows the most viewed videos of the selected period, and allows the user to narrow the list to specific groups of channels.

![top videos list](/about/ttube-topvideos.gif)

We hope that transparency.tube will help generate new insights around political YouTube and reconcile some common misconceptions.


Here are a few that stand out:
*   Independent YouTube creators get most of the attention in the press, but traditional / mainstream media outlets have accounted for more traffic than “YouTubers” over the last year and a half.
*   Only looking at the most popular channels or videos provides a misleading representation of the whole. For example, late night talk shows have mostly top tier channels, compared to partisan right, which is a bigger group of channels, but is made up mainly of mid and low-range channels.
*   Despite YouTube’s efforts to limit the reach of conspiracy content, it still accounts for a significant amount of traffic on the platform.


Our intention is to follow this launch with a number of articles that dive deeper into political YouTube. Some of the topics we will address are:
*   QAnon ban - How big did the group get and how much content still remains on YouTube.
*   Mainstream Media vs. Independent YouTube over the last three years
*   Tag overlap
*   Watch time vs. views - what metric is best for measuring the impact of content

We hope you find this as fascinating as we do and use our site to understand and report on political YouTube.`


const AboutStyle = styled.div`
  max-width: 800px;
  margin: auto;
  font-size: 1.4em;
  font-family: charter, Georgia, Cambria, "Times New Roman", Times, serif;
  h1, h2, h3 {
    margin-bottom: 2em;
    font-weight: 800;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  }
  p, ul {
    margin-bottom: 2em;
  }
  ul {
    list-style-position: outside;
    margin-top: -1em;
    margin-left: 1em;
    li {
      margin-bottom: 1em;
    }
  }

  img {
    width: 100%
  }
`

const AboutPage = () => (
  <Layout>
    <AboutStyle>
      <Markdown>{aboutMd}</Markdown>
    </AboutStyle>
    <Footer />
  </Layout>
)

export default AboutPage
