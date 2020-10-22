<h1 align="center">
  transparency.tube
</h1>

[![Netlify Status](https://api.netlify.com/api/v1/badges/5c63003a-7edb-41e3-ac4d-221253a66cae/deploy-status)](https://app.netlify.com/sites/laughing-hopper-65d275/deploys)


## Download Data
Data is collected by [recfluence](https://github.com/markledwich2/Recfluence).

Download latest classified [channels](https://pyt.blob.core.windows.net/data/results/ttube_channels.jsonl.gz)

For video statistics, captions and other larger please contact mark@ledwich.com.au to arrange at-cost access to the database.

## Metrics
**Video views**: *Transparency.tube* records statistics for younger-than-365-days videos for all channels each day.

Note:
- For channels with large back-catalogs, we read older videos to try and capture all the views on a day
- When new channels are added to transparency.tube, the history of views are estimated based on the upload date of videos.

Click on a channel to see more detail about the collection of video statistics.

**Channel Views**: The total number of channel views as reported by the YouTube API.

Note: 
- More reliable than `video views` for channels with large backlogs (e.g. AP Archive), but less reliable for channels that have videos removed.
- We only have data for channels since we have added them to our dataset, so we show only the latest figures.

**Watch Hours**: 
This estimate of hours of video watched is based on the [data collected](https://github.com/sTechLab/YouTubeDurationData) from [this study from 2017](https://arxiv.org/pdf/1603.08308.pdf). For each video, we calculate \`*average % of video watch for this videos duration\` x \`video views\`

**Subscribers**: The number of subscribers to the channel as provided by the YouTube API. Note, a small amount of channels hide this data.


## Data Collection and Periods
Stats are collected each day starting at 00:00 GMT and the dates displayed are all in GMT. We decided to use a common date because this makes it easy to compare full-days that are the same for different timezones.

## Classification
For a description of how channels are manually reviewed, see [Recfluence](https://github.com/markledwich2/). 
To understand the automatic classification, see [Chan2Vec](https://github.com/sam-clark/chan2vec#chan2vec)



