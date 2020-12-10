import React from "react"
import { groupBy } from 'remeda'
import styled from 'styled-components'
import { entries } from '../common/Pipe'
import { dateFormat } from '../common/Utils'
import { videoThumb, videoUrl } from '../common/Video'
import Layout, { FlexRow, TextPage } from "../components/Layout"
import { Markdown } from '../components/Markdown'


interface Logo {
  svg?: React.SVGProps<SVGSVGElement>
  src?: string
}

interface SeenIn {
  url?: string,
  title: string,
  publisher?: string,
  author?: string,
  authorImg?: string,
  date?: string,
  thumb?: string
  videoId?: string
}

const seenIn: SeenIn[] = [
  {
    url: 'https://www.nytimes.com/2020/11/18/technology/election-misinformation-often-evaded-youtubes-efforts-to-stop-it.html',
    title: 'Election misinformation often evaded YouTube’s efforts to stop it.',
    publisher: 'New York Times',
    author: 'Sheera Frenkel',
    authorImg: 'https://static01.nyt.com/images/2018/06/14/multimedia/author-sheera-frenkel/author-sheera-frenkel-thumbLarge.png',
    date: '2020-11-18'
  },
  {
    url: 'https://www.nytimes.com/2020/11/16/technology/fox-news-youtube-election.html',
    title: 'Fox News’s ‘partisan right’ audience on YouTube is dropping, researchers say.',
    publisher: 'New York Times',
    author: 'Daisuke Wakabayashi',
    authorImg: 'https://static01.nyt.com/images/2018/07/30/multimedia/author-daisuke-wakabayashi/author-daisuke-wakabayashi-thumbLarge.png',
    date: '2020-11-16'
  },
  {
    url: 'https://www.vox.com/recode/21551696/stolen-election-misinformation-youtube-trump-voter-fraud',
    title: 'YouTube is awash with election misinformation — and it isn’t taking it down',
    publisher: 'Vox',
    author: 'Rebecca Heilweil',
    date: '2020-11-06'
  },
  {
    url: 'https://www.vox.com/recode/2020/11/3/21545053/trump-youtube-campaign-homepage-advertisements',
    title: 'Why the Trump campaign is going all-in on YouTube',
    publisher: 'Vox',
    author: 'Rebecca Heilweil',
    date: '2020-11-03'
  },
  {
    publisher: 'YouTube',
    author: 'NowThis News',
    authorImg: 'https://yt3.ggpht.com/ytc/AAUvwniL7tpZNpVhiJMxIVOzAZ19IiIckhvoZPsgOH9KoA=s88-c-k-c0xffffffff-no-rj-mo',
    videoId: 'BfYJeeSsiO4',
    title: 'False Voter Fraud Videos Receive Millions of Views on YouTube',
    date: '2020-11-05'
  },
  {
    publisher: 'YouTube',
    author: 'Clownfish TV',
    authorImg: 'https://yt3.ggpht.com/ytc/AAUvwniq_94ZfitkRUVcEU13Tb0dzzHdejxlGlMDSnet=s176-c-k-c0x00ffffff-no-rj',
    videoId: 'lK4OGFIhtco',
    title: 'Transparency Tube could be CATASTROPHIC for YouTube Creators!',
    date: '2020-10-27'
  },
  {
    publisher: 'YouTube',
    author: 'ADAM FRIENDED',
    authorImg: 'https://yt3.ggpht.com/ytc/AAUvwngum1biUFHFAW1O_LwtEBi1weJB04e5ksHQrIv1nQ=s88-c-k-c0xffffffff-no-rj-mo',
    videoId: 'ZHEyuIZl-gU',
    title: 'YOUTUBE POLITICS: Transparency Tube',
    date: '2020-10-26'
  },
  {
    publisher: 'YouTube',
    author: 'Styxhexenhammer666',
    authorImg: 'https://yt3.ggpht.com/ytc/AAUvwnhmXwCHYHYcCxPRfHonF5m1mDBu7J1LsM-V_viR7Q=s88-c-k-c0xffffffff-no-rj-mo',
    videoId: 'Jxjao3rI9GU',
    title: 'Transparency Tube is Pretty Interesting',
    date: '2020-10-28'
  },
  {
    publisher: 'YouTube',
    author: 'Romanian TVee',
    authorImg: 'https://yt3.ggpht.com/ytc/AAUvwnhljL9TpgPNc_Qb7NUbVte-LmAQydvi60N-tNB7=s88-c-k-c0xffffffff-no-rj-mo',
    videoId: 'zZfPFERaYr4',
    title: 'Why are youtubers scared of Transparency Tube ?',
    date: '2020-10-29'
  }
]

const imgStyle = { height: '50px', fill: 'currentColor' }

const publisherImg: Record<string, Logo> = {
  'New York Times': {
    svg: <svg viewBox="0 0 184 25" style={imgStyle}>
      <path
        d="M13.8 2.9c0-2-1.9-2.5-3.4-2.5v.3c.9 0 1.6.3 1.6 1 0 .4-.3 1-1.2 1-.7 0-2.2-.4-3.3-.8C6.2 1.4 5 1 4 1 2 1 .6 2.5.6 4.2c0 1.5 1.1 2 1.5 2.2l.1-.2c-.2-.2-.5-.4-.5-1 0-.4.4-1.1 1.4-1.1.9 0 2.1.4 3.7.9 1.4.4 2.9.7 3.7.8v3.1L9 10.2v.1l1.5 1.3v4.3c-.8.5-1.7.6-2.5.6-1.5 0-2.8-.4-3.9-1.6l4.1-2V6l-5 2.2C3.6 6.9 4.7 6 5.8 5.4l-.1-.3c-3 .8-5.7 3.6-5.7 7 0 4 3.3 7 7 7 4 0 6.6-3.2 6.6-6.5h-.2c-.6 1.3-1.5 2.5-2.6 3.1v-4.1l1.6-1.3v-.1l-1.6-1.3V5.8c1.5 0 3-1 3-2.9zm-8.7 11l-1.2.6c-.7-.9-1.1-2.1-1.1-3.8 0-.7 0-1.5.2-2.1l2.1-.9v6.2zm10.6 2.3l-1.3 1 .2.2.6-.5 2.2 2 3-2-.1-.2-.8.5-1-1V9.4l.8-.6 1.7 1.4v6.1c0 3.8-.8 4.4-2.5 5v.3c2.8.1 5.4-.8 5.4-5.7V9.3l.9-.7-.2-.2-.8.6-2.5-2.1L18.5 9V.8h-.2l-3.5 2.4v.2c.4.2 1 .4 1 1.5l-.1 11.3zM34 15.1L31.5 17 29 15v-1.2l4.7-3.2v-.1l-2.4-3.6-5.2 2.8v6.6l-1 .8.2.2.9-.7 3.4 2.5 4.5-3.6-.1-.4zm-5-1.7V8.5l.2-.1 2.2 3.5-2.4 1.5zM53.1 2c0-.3-.1-.6-.2-.9h-.2c-.3.8-.7 1.2-1.7 1.2-.9 0-1.5-.5-1.9-.9l-2.9 3.3.2.2 1-.9c.6.5 1.1.9 2.5 1v8.3L44 3.2c-.5-.8-1.2-1.9-2.6-1.9-1.6 0-3 1.4-2.8 3.6h.3c.1-.6.4-1.3 1.1-1.3.5 0 1 .5 1.3 1v3.3c-1.8 0-3 .8-3 2.3 0 .8.4 2 1.6 2.3v-.2c-.2-.2-.3-.4-.3-.7 0-.5.4-.9 1.1-.9h.5v4.2c-2.1 0-3.8 1.2-3.8 3.2 0 1.9 1.6 2.8 3.4 2.7v-.2c-1.1-.1-1.6-.6-1.6-1.3 0-.9.6-1.3 1.4-1.3.8 0 1.5.5 2 1.1l2.9-3.2-.2-.2-.7.8c-1.1-1-1.7-1.3-3-1.5V5l8 14h.6V5c1.5-.1 2.9-1.3 2.9-3zm7.3 13.1L57.9 17l-2.5-2v-1.2l4.7-3.2v-.1l-2.4-3.6-5.2 2.8v6.6l-1 .8.2.2.9-.7 3.4 2.5 4.5-3.6-.1-.4zm-5-1.7V8.5l.2-.1 2.2 3.5-2.4 1.5zM76.7 8l-.7.5-1.9-1.6-2.2 2 .9.9v7.5l-2.4-1.5V9.6l.8-.5-2.3-2.2-2.2 2 .9.9V17l-.3.2-2.1-1.5v-6c0-1.4-.7-1.8-1.5-2.3-.7-.5-1.1-.8-1.1-1.5 0-.6.6-.9.9-1.1v-.2c-.8 0-2.9.8-2.9 2.7 0 1 .5 1.4 1 1.9s1 .9 1 1.8v5.8l-1.1.8.2.2 1-.8 2.3 2 2.5-1.7 2.8 1.7 5.3-3.1V9.2l1.3-1-.2-.2zm18.6-5.5l-1 .9-2.2-2-3.3 2.4V1.6h-.3l.1 16.2c-.3 0-1.2-.2-1.9-.4l-.2-13.5c0-1-.7-2.4-2.5-2.4s-3 1.4-3 2.8h.3c.1-.6.4-1.1 1-1.1s1.1.4 1.1 1.7v3.9c-1.8.1-2.9 1.1-2.9 2.4 0 .8.4 2 1.6 2V13c-.4-.2-.5-.5-.5-.7 0-.6.5-.8 1.3-.8h.4v6.2c-1.5.5-2.1 1.6-2.1 2.8 0 1.7 1.3 2.9 3.3 2.9 1.4 0 2.6-.2 3.8-.5 1-.2 2.3-.5 2.9-.5.8 0 1.1.4 1.1.9 0 .7-.3 1-.7 1.1v.2c1.6-.3 2.6-1.3 2.6-2.8s-1.5-2.4-3.1-2.4c-.8 0-2.5.3-3.7.5-1.4.3-2.8.5-3.2.5-.7 0-1.5-.3-1.5-1.3 0-.8.7-1.5 2.4-1.5.9 0 2 .1 3.1.4 1.2.3 2.3.6 3.3.6 1.5 0 2.8-.5 2.8-2.6V3.7l1.2-1-.2-.2zm-4.1 6.1c-.3.3-.7.6-1.2.6s-1-.3-1.2-.6V4.2l1-.7 1.4 1.3v3.8zm0 3c-.2-.2-.7-.5-1.2-.5s-1 .3-1.2.5V9c.2.2.7.5 1.2.5s1-.3 1.2-.5v2.6zm0 4.7c0 .8-.5 1.6-1.6 1.6h-.8V12c.2-.2.7-.5 1.2-.5s.9.3 1.2.5v4.3zm13.7-7.1l-3.2-2.3-4.9 2.8v6.5l-1 .8.1.2.8-.6 3.2 2.4 5-3V9.2zm-5.4 6.3V8.3l2.5 1.8v7.1l-2.5-1.7zm14.9-8.4h-.2c-.3.2-.6.4-.9.4-.4 0-.9-.2-1.1-.5h-.2l-1.7 1.9-1.7-1.9-3 2 .1.2.8-.5 1 1.1v6.3l-1.3 1 .2.2.6-.5 2.4 2 3.1-2.1-.1-.2-.9.5-1.2-1V9c.5.5 1.1 1 1.8 1 1.4.1 2.2-1.3 2.3-2.9zm12 9.6L123 19l-4.6-7 3.3-5.1h.2c.4.4 1 .8 1.7.8s1.2-.4 1.5-.8h.2c-.1 2-1.5 3.2-2.5 3.2s-1.5-.5-2.1-.8l-.3.5 5 7.4 1-.6v.1zm-11-.5l-1.3 1 .2.2.6-.5 2.2 2 3-2-.2-.2-.8.5-1-1V.8h-.1l-3.6 2.4v.2c.4.2 1 .3 1 1.5v11.3zM143 2.9c0-2-1.9-2.5-3.4-2.5v.3c.9 0 1.6.3 1.6 1 0 .4-.3 1-1.2 1-.7 0-2.2-.4-3.3-.8-1.3-.4-2.5-.8-3.5-.8-2 0-3.4 1.5-3.4 3.2 0 1.5 1.1 2 1.5 2.2l.1-.2c-.3-.2-.6-.4-.6-1 0-.4.4-1.1 1.4-1.1.9 0 2.1.4 3.7.9 1.4.4 2.9.7 3.7.8V9l-1.5 1.3v.1l1.5 1.3V16c-.8.5-1.7.6-2.5.6-1.5 0-2.8-.4-3.9-1.6l4.1-2V6l-5 2.2c.5-1.3 1.6-2.2 2.6-2.9l-.1-.2c-3 .8-5.7 3.5-5.7 6.9 0 4 3.3 7 7 7 4 0 6.6-3.2 6.6-6.5h-.2c-.6 1.3-1.5 2.5-2.6 3.1v-4.1l1.6-1.3v-.1L140 8.8v-3c1.5 0 3-1 3-2.9zm-8.7 11l-1.2.6c-.7-.9-1.1-2.1-1.1-3.8 0-.7.1-1.5.3-2.1l2.1-.9-.1 6.2zm12.2-12h-.1l-2 1.7v.1l1.7 1.9h.2l2-1.7v-.1l-1.8-1.9zm3 14.8l-.8.5-1-1V9.3l1-.7-.2-.2-.7.6-1.8-2.1-2.9 2 .2.3.7-.5.9 1.1v6.5l-1.3 1 .1.2.7-.5 2.2 2 3-2-.1-.3zm16.7-.1l-.7.5-1.1-1V9.3l1-.8-.2-.2-.8.7-2.3-2.1-3 2.1-2.3-2.1L154 9l-1.8-2.1-2.9 2 .1.3.7-.5 1 1.1v6.5l-.8.8 2.3 1.9 2.2-2-.9-.9V9.3l.9-.6 1.5 1.4v6l-.8.8 2.3 1.9 2.2-2-.9-.9V9.3l.8-.5 1.6 1.4v6l-.7.7 2.3 2.1 3.1-2.1v-.3zm8.7-1.5l-2.5 1.9-2.5-2v-1.2l4.7-3.2v-.1l-2.4-3.6-5.2 2.8v6.8l3.5 2.5 4.5-3.6-.1-.3zm-5-1.7V8.5l.2-.1 2.2 3.5-2.4 1.5zm14.1-.9l-1.9-1.5c1.3-1.1 1.8-2.6 1.8-3.6v-.6h-.2c-.2.5-.6 1-1.4 1-.8 0-1.3-.4-1.8-1L176 9.3v3.6l1.7 1.3c-1.7 1.5-2 2.5-2 3.3 0 1 .5 1.7 1.3 2l.1-.2c-.2-.2-.4-.3-.4-.8 0-.3.4-.8 1.2-.8 1 0 1.6.7 1.9 1l4.3-2.6v-3.6h-.1zm-1.1-3c-.7 1.2-2.2 2.4-3.1 3l-1.1-.9V8.1c.4 1 1.5 1.8 2.6 1.8.7 0 1.1-.1 1.6-.4zm-1.7 8c-.5-1.1-1.7-1.9-2.9-1.9-.3 0-1.1 0-1.9.5.5-.8 1.8-2.2 3.5-3.2l1.2 1 .1 3.6z">
      </path>
    </svg>
  },
  'Vox': {
    svg: <svg id="Layer_1" viewBox="0 0 242 121" style={imgStyle}>
      <path d="M110.674 3.528h3.474L114.564 2H71.63l-.418 1.528h6.253c5.418 0 9.726 3.75 9.726 11.255 0 4.168-1.8 9.587-4.72 16.118L54.82 92.32l-6.81-79.756c-.556-6.252 2.5-9.03 9.59-9.03h4.027L62.042 2H1.6l-.557 1.528h3.89c4.725 0 6.532 2.918 7.087 8.615l10.7 103.1h25.427l42.518-90.038c6.392-13.48 13.2-21.677 20.01-21.677zm-5.002 112.27c-3.89 0-6.253-1.25-6.253-7.642 0-8.06 2.91-23.76 6.11-38.072.41 6.67 5 13.2 11.81 13.2 1.67 0 3.06-.138 4.44-.417-6.26 27.236-8.76 32.932-16.12 32.932zm121.024-54.19c8.06 0 13.2-6.67 13.2-14.173 0-6.392-4.585-11.116-11.115-11.116-11.81 0-17.36 9.31-27.09 26.53-2.08-10.7-6.94-24.73-19.45-24.73-14.03 0-30.15 20.01-45.02 32.37-6.67 5.56-14.17 9.17-20.15 9.17-6.11 0-9.72-6.26-9.72-17.23 4.31-17.93 6.67-22.65 13.34-22.65 4.59 0 6.53 2.64 6.53 8.06 0 5.69-1.25 15.42-3.75 27.51 6.67-2.09 16.68-10.42 25.01-19.45-4.44-10.56-13.89-17.79-27.65-17.79-25.42 0-47.66 22.78-47.66 48.35 0 17.65 12.51 30.984 32.1 30.984 32.38 0 45.86-28.066 45.86-47.52 0-2.78-.14-4.86-.42-7.364C155.717 57.14 162.108 52 167.388 52c5.975 0 10.7 15.007 15.423 37.657-4.17 4.58-8.34 13.474-10.42 15.002-.836-8.06-6.115-13.06-13.2-13.06-7.92 0-13.48 7.5-13.48 13.893 0 7.226 5 11.95 11.53 11.95 13.76 0 17.65-13.062 26.265-24.595 2.64 12.363 8.754 24.59 19.313 24.59 12.506 0 24.178-10.7 30.15-18.34l-1.11-1.81c-3.89 3.753-7.642 6.254-11.95 6.254-7.78 0-13.34-16.81-17.645-37.1 2.5-3.47 6.53-12.225 9.31-15.28 1.95 3.612 5.978 10.42 15.15 10.42z"></path>
    </svg>
  },
  'YouTube': {
    svg: <svg viewBox="0 0 502 210.649" style={imgStyle}>
      <g>
        <path d="M498.333 45.7s-2.91-20.443-11.846-29.447C475.157 4.44 462.452 4.38 456.627 3.687c-41.7-3-104.25-3-104.25-3h-.13s-62.555 0-104.255 3c-5.826.693-18.523.753-29.86 12.566-8.933 9.004-11.84 29.447-11.84 29.447s-2.983 24.003-2.983 48.009v22.507c0 24.006 2.983 48.013 2.983 48.013s2.907 20.44 11.84 29.446c11.337 11.817 26.23 11.44 32.86 12.677 23.84 2.28 101.315 2.983 101.315 2.983s62.62-.094 104.32-3.093c5.824-.694 18.527-.75 29.857-12.567 8.936-9.006 11.846-29.446 11.846-29.446s2.98-24.007 2.98-48.013V93.709c0-24.006-2.98-48.01-2.98-48.01" fill="#cd201f" />
        <g>
          <path d="M187.934 169.537h-18.96V158.56c-7.19 8.24-13.284 12.4-19.927 12.4-5.826 0-9.876-2.747-11.9-7.717-1.23-3.02-2.103-7.736-2.103-14.663V68.744h18.957v81.833c.443 2.796 1.636 3.823 4.043 3.823 3.63 0 6.913-3.153 10.93-8.817V68.744h18.96v100.793zM102.109 139.597c.996 9.98-2.1 14.93-7.987 14.93s-8.98-4.95-7.98-14.93v-39.92c-1-9.98 2.093-14.657 7.98-14.657 5.89 0 8.993 4.677 7.996 14.657l-.01 39.92zm18.96-37.923c0-10.77-2.164-18.86-5.987-23.95-5.054-6.897-12.973-9.72-20.96-9.72-9.033 0-15.913 2.823-20.957 9.72-3.886 5.09-5.97 13.266-5.97 24.036l-.016 35.84c0 10.71 1.853 18.11 5.736 23.153 5.047 6.873 13.227 10.513 21.207 10.513 7.986 0 16.306-3.64 21.36-10.513 3.823-5.043 5.586-12.443 5.586-23.153v-35.926zM46.223 114.647v54.889h-19.96v-54.89S5.582 47.358 1.314 34.815H22.27L36.277 87.38l13.936-52.566H71.17l-24.947 79.833z" />
        </g>
        <g fill="#fff">
          <path d="M440.413 96.647c0-9.33 2.557-11.874 8.59-11.874 5.99 0 8.374 2.777 8.374 11.997v10.893l-16.964.02V96.647zm35.96 25.986l-.003-20.4c0-10.656-2.1-18.456-5.88-23.5-5.06-6.823-12.253-10.436-21.317-10.436-9.226 0-16.42 3.613-21.643 10.436-3.84 5.044-6.076 13.28-6.076 23.943v34.927c0 10.596 2.46 18.013 6.296 23.003 5.227 6.813 12.42 10.216 21.87 10.216 9.44 0 16.853-3.566 21.85-10.81 2.2-3.196 3.616-6.82 4.226-10.823.164-1.81.64-5.933.64-11.753v-2.827h-18.96c0 7.247.037 11.557-.133 12.54-1.033 4.834-3.623 7.25-8.07 7.25-6.203 0-8.826-4.636-8.76-13.843v-17.923h35.96zM390.513 140.597c0 9.98-2.353 13.806-7.563 13.806-2.973 0-6.4-1.53-9.423-4.553l.02-60.523c3.02-2.98 6.43-4.55 9.403-4.55 5.21 0 7.563 2.93 7.563 12.91v42.91zm2.104-72.453c-6.647 0-13.253 4.087-19.09 11.27l.02-43.603h-17.963V169.54h17.963l.027-10.05c6.036 7.47 12.62 11.333 19.043 11.333 7.193 0 12.45-3.85 14.863-11.267 1.203-4.226 1.993-10.733 1.993-19.956V99.684c0-9.447-1.21-15.907-2.416-19.917-2.41-7.466-7.247-11.623-14.44-11.623M340.618 169.537h-18.956V158.56c-7.193 8.24-13.283 12.4-19.926 12.4-5.827 0-9.877-2.747-11.9-7.717-1.234-3.02-2.107-7.736-2.107-14.663V69.744h18.96v80.833c.443 2.796 1.633 3.823 4.043 3.823 3.63 0 6.913-3.153 10.93-8.817V69.744h18.957v99.793z" />
          <path d="M268.763 169.537h-19.956V54.77h-20.956V35.835l62.869-.024v18.96h-21.957v114.766z" />
        </g>
      </g>
    </svg>
  },
}


const SeenStyle = styled.div`
   margin-bottom: 3em;

  .seen {
    margin: 1em 0 2em;
  }

  h3 {
    margin: 0.5em 0;
  }

  h3 > a {
    color:var(--fg1);
  }

  div.author {
    font-size:0.9em;
    color: var(--fg2);
    align-items: center;
  }
`

const MediaPage = () => {
  const list = seenIn.map(s => s.videoId ? { ...s, url: s.url ?? videoUrl(s.videoId), thumb: s.thumb ?? videoThumb(s.videoId, 'high') } : s)
  const byPublisher = entries(groupBy(list, g => g.publisher)).map(([name, items]) => ({ name, items }))

  return <Layout>
    <TextPage>
      {byPublisher.map(p => {
        const img = publisherImg[p.name]
        return <SeenStyle>
          <div>
            {img?.svg ? img.svg : img?.src ? <img src={img.src} alt={p.name} /> : <h2>{p.name}</h2>}
          </div>
          {p.items.map(i => <div className='seen'>
            {i.thumb ?
              <FlexRow space='1em' style={{ alignItems: 'center' }}>
                <div ><a href={i.url}><img src={i.thumb} style={{ width: '200px' }} /></a></div>
                <div>
                  <h3><a href={i.url}>{i.title}</a></h3>
                  <Author author={i.author} authorImg={i.authorImg} date={i.date} />
                </div>
              </FlexRow>
              : <>
                <h3><a href={i.url}>{i.title}</a></h3>
                <Author author={i.author} authorImg={i.authorImg} date={i.date} />
              </>
            }
          </div>)}
        </SeenStyle>
      })}
    </TextPage>
  </Layout>
}


const Author = ({ author, authorImg, date }: { author: string, authorImg?: string, date?: string }) => <FlexRow className='author'>
  {authorImg && <img src={authorImg} style={{ width: '60px', clipPath: 'circle()' }} />}
  <div>
    <div><b>{author}</b></div>
    <div>{dateFormat(date)}</div>
  </div>
</FlexRow>

export default MediaPage
