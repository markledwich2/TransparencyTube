import React from "react"
import ReactMarkdown from 'react-markdown'
import { Footer } from '../components/Footer'
import Layout, { MdPageStyle } from "../components/Layout"
import { Markdown } from '../components/Markdown'
import ImgLateNightVsConspiracy from '../images/press/late-night-vs-conspiracy.png'
import ImgPartisanLeftRight from '../images/press/partisan-left-right.png'

const pressMd = `
**FOR IMMEDIATE RELEASE: **

**Press Contact: hello@transparency.tube**

**Cell: 3303271644**

**Data scientists conduct the first-ever comprehensive analysis of politics on YouTube, including the most thorough assessment of QAnon content on YouTube to date. **

_Data scientists Sam Clark and Mark Ledwich have launched [Transparency.tube](https://transparency.tube/), a first-of-its-kind map of political content on YouTube. The tool offers an unprecedented look at the political landscape on a platform that Americans are increasingly using as a news source._

Data scientists Sam Clark and Mark Ledwich have categorized, indexed, and analyzed over 8,000 of the largest English language YouTube channels actively discussing political and cultural issues, creating a first-of-its-kind, real-time political map of the YouTube space. Their analytical tool, called[ Transparency.tube](https://transparency.tube/), measures the size of a number of different segments, including larger segments such as partisan left and right content; smaller niche segments like libertarians, socialists, and anti-theists; and controversial segments such as men’s rights activists and QAnon believers. The result is an interactive visualization of 8,162 categorized channels, including data on views, estimated watch time, subscribers, and video content for the approximately 9.3M videos posted by these channels.  

_“It’s scary how important YouTube has become, but how little we know about the spread of certain ideas on the platform, like the QAnon conspiracy. At the heart of this problem is an asymmetry between those with the skills and the incentives necessary to answer these questions,” says **Sam Clark**, “Google has the technical talent necessary, but there is no good business reason (and a lot of bad ones) to do this research. On the other hand, journalists and social scientists see the clear necessity of this research, but don’t have the technical knowledge to pull it off.”_

Their analysis comes as YouTube’s role in shaping the American cultural and political landscape is growing; YouTube is used by[ 71% of Americans](https://www.journalism.org/2020/09/28/youtube-news-consumers-about-as-likely-to-use-the-site-for-opinions-as-for-facts/) and is a source of news for[ 26% of US adults](https://www.journalism.org/2020/09/28/many-americans-get-news-on-youtube-where-news-organizations-and-independent-producers-thrive-side-by-side/). Yet until now, there had been no large scale analyses of YouTube’s content. This is partially an issue of data; the platform contains a vast amount of content, and any in-depth analysis demands advanced AI and machine learning capabilities. Clark and Ledwich recognized that Google, YouTube’s owner, clearly has the ability to thoroughly analyze the political and cultural ideas being shared on YouTube, but has no incentive to do so given the controversy around its content.

_“YouTube wields unfathomable influence over the consumption of ideas, and the intense scrutiny of their platform has just started. Transparency tube collects statistics on more than 8 million video's daily to build a full picture of the reach of political and cultural content. I'm hoping this will lead to more informed criticism — improving the chaotic information environment we are only beginning to understand.“ said **Mark** **Ledwich**._

Transparency.tube fills this data vacuum to help journalists, researchers, and the curious better understand YouTube’s political landscape. To build this tool, Ledwich and Clark used a machine learning approach, developed by Clark, that leverages subscription information of commenters to categorize channels. The accuracy of the method is on par with a manual categorization of channels. Clark partnered with a postdoctoral researcher at Berkeley, Anna Zaitsev, to do a formal study of the method and a preprint is available [here](https://arxiv.org/abs/2010.09892).

**_Key insights from the analysis:  _**



*   Differences between high-subscription channels and overall attention: For 257 political channels with over 500K subscribers, only 1.6% of traffic goes to Conspiracy channels and 14.6% goes to Partisan Right channels. However, for channels with over 10K subscribers (including those with over 500K subscribers), 6.5% of traffic goes to Conspiracy channels and 19.8% goes to Partisan Left channels. 
*   Independent YouTube creators,or “YouTubers”, get most of the attention in the press, but traditional / mainstream media outlets have accounted for more traffic than YouTubers over the last year and a half.
*   Despite YouTube’s efforts to limit the reach of conspiracy content, it still accounts for a significant amount of traffic on the platform.

**_Examples from looking at 2020 total view data:_**



*   From the screenshot below we can see that there is a sea of small conspiracy channels most people don't know that received a similar amount of total traffic as the late night talk show hosts that nearly everyone knows about. Additionally, the color of the bubbles shows that all late night talk shows are left leaning, while the majority of conspiracy channels are right leaning or centrist.


![late night vs conspiracy](${ImgLateNightVsConspiracy})


*   This screenshot shows something similar for partisan right vs. left. For this example though, the coloring has been changed to represent media type. We can see that most partisan left traffic goes to mainstream media channels (purple) while most partisan right traffic goes to independent youtube channels (green).


![partisan left vs right](${ImgPartisanLeftRight})

**_About the creators_**

**Sam Clark** is a data scientist and machine learning engineer focused on natural language processing. Formerly at Decide.com and Ebay, he has taken a sabbatical to study how the latest developments in natural language processing can help provide transparency into YouTube content. He holds a BS and MS in Computer Science from the University of Washington and is currently based in Seattle. 

**Mark Ledwich** is a full stack software developer in data and visualization. Prior to working on Transparency.tube, he conducted his own [analysis of YouTube’s political influence](https://recfluence.net/) through its recommendation system. He holds a Software Engineering degree from the University of Queensland and is currently based in Brisbane, Australia.
`


const PressPage = () => {

  return <Layout>
    <MdPageStyle>
      <h2>Press Release</h2>
      <ReactMarkdown>{pressMd}</ReactMarkdown>
    </MdPageStyle>
    <Footer />
  </Layout>
}

export default PressPage