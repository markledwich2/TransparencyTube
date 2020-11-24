import React from "react"
import Layout, { TextPage } from "../components/Layout"
import { Markdown } from '../components/Markdown'

const md = `
## **Why did we create transparency.tube?**

YouTube is playing an important role in shaping opinions around political and cultural issues, but quality data around what ideas are being shared on the platform has been lacking. We decided to fill this void by building transparency.tube and hope it will be useful for journalists, social scientists, and citizens to better understand what is transpiring on political and cultural YouTube. Further information can be found on the[ about page](https://transparency.tube/about).


## **Are you a political organization or do you have political goals?**

No. We have different political beliefs, have funded this project ourselves, and plan on keeping it independent / non-partisan. Our creators share concerns about the volume of misinformation on YouTube though and hope our data can be useful for finding appropriate solutions to this problem.


## **Who is responsible for the manual labeling of channels?**

The initial set of 786 channels was labeled by three reviewers and leveraged previous work done by[ Ad Fontes Media](https://www.adfontesmedia.com/),[ Media Bias/Fact Check](https://mediabiasfactcheck.com/),[ Data & Society](https://datasociety.net/library/alternative-influence/), and a number of other sources. More information on this process can be found[ here](https://github.com/markledwich2/Recfluence). Since then an additional 305 channels have been reviewed by one to three reviewers in order to correct misclassifications by the model or review the models performance.


## **How does the model that generates automatic labels work?**

The model used to generate automatic labels for channels that haven’t been manually labeled is documented[ here](https://github.com/sam-clark/chan2vec) and a preprint of a paper describing it is available[ here](https://arxiv.org/abs/2010.09892). Both of these sources contain information on the accuracy of the model for each tag as well as for predicting whether a channel is political / cultural or not.


## **How can I report a mislabeled channel?**

First, please understand that _channels_ are given labels based on the _content_ of their _videos_, not the _identity_ of the content creator. Please report any _channels_ that appear to be misclassified to hello@transparency.tube .


## **How are left, center, and right labels assigned if a channel doesn’t discuss politics?**

Our dataset consists of channels that discuss politics as well as a number of channels that are limited to “culture war” topics. These cultural discussions may not mention political issues, but frequently revolve around beliefs / arguments that are aligned with the left or right, such as the argument that[ LGBT representation in 90s TV cartoons weren’t positive](https://www.youtube.com/watch?v=L--Fa8_ujBA) or the[ belief that feminist responses to a Star Wars comic were unreasonable](https://www.youtube.com/watch?v=ht2YPLIfT_I).

Furthermore, a channel may not explicitly discuss politics, but it may discuss issues that are in fact political. As such, content is categorized accordingly and such categorization is _not based on the channel owners identification of political affiliation_, but rather, as a measurement of content on the channel. For example, it's broadly the case that 'gun rights' lives on the right side of the political spectrum. In this example, a channel owner who personally identifies as a socialist (leftist) who is pro gun rights, and posts only pro gun rights content on their channel, their channel will be categorized on the right side of the spectrum. Similarly, someone may identify as a libertarian but also pro-choice and if their channel presents pro-choice content, then based on their channel measurement it would appear in our visualization on the left side of the spectrum.

In this context, we label a channels content as follows:



*   Left - Overwhelmingly contains cultural or political content that would be considered left leaning or overwhelmingly criticizes the right.
*   Center - A mix of left, right, and neutral cultural and political content.
*   Right - Overwhelmingly contains cultural or political content that would be considered right leaning or overwhelmingly criticizes the left.

As we have noted elsewhere on the site, this is not an attempt to label or categorize the _identity_ of the channel owner, but rather an exercise in measuring the type of video _content_ on the channel.`


const FaqPage = () => {

  return <Layout>
    <TextPage>
      <Markdown>{md}</Markdown>
    </TextPage>
  </Layout>
}

export default FaqPage
