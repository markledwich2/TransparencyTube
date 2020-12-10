import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import PurposeBanner from '../components/PurposeBanner'

const PersonalizationPage = () => <Layout>
  <PurposeBanner>
    <p>YouTube's recommended videos are tailored for each user taking into account watch history. We created 15 personas, each with their own watch history to see how YouTube's personalization works. </p>
  </PurposeBanner>

  <div>
    TODO: venn diagram for a hand picked collection of videos
  </div>
</Layout>

export default PersonalizationPage