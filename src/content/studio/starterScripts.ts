import type { StarterScript } from './types';

/** The first-run script and one starter per preset (14.5). Bodies use Studio markup (11.6). */
export const starterScripts: StarterScript[] = [
  {
    id: 'starter-introduce-yourself',
    name: 'Introduce yourself in 30 seconds',
    presetId: null,
    title: 'Introduce yourself in 30 seconds',
    aspect: '9:16',
    targetSeconds: 30,
    body: `# Hello
Hi, I'm {name}. [smile]
# What I do
I {what you do}, and I do it for {who you help}.
# Why it matters
Most of them come to me stuck, short on time, and tired of guessing. [pause]
# What to expect
Here you can expect {what to expect}. Short videos, plain words, and one useful idea every time.
# Close
If that sounds like you, follow along, and tell me in the comments what you want to see first.`,
  },
  {
    id: 'starter-reels',
    name: 'Reels starter: one quick tip',
    presetId: 'instagram-reels',
    title: 'One quick tip for Reels',
    aspect: '9:16',
    targetSeconds: 30,
    body: `# Hook
If you keep struggling with {your topic}, try this one small change.
# Context
Most people try to do too much at once, and then they quit before it works. [pause]
# Value
Here is the fix. **Pick one thing**, and do it for {time}. Then check what changed, so you know it is working.
# Close
Try it this week and tell me how it goes. Follow for the next tip. [smile]`,
  },
  {
    id: 'starter-shorts',
    name: 'Shorts starter: a one minute explainer',
    presetId: 'youtube-shorts',
    title: 'A one minute explainer',
    aspect: '9:16',
    targetSeconds: 60,
    body: `# Hook
Here is the simplest way to understand {your topic}.
# Problem
Most explanations start with the hard part, so people give up in the first minute. [pause]
# Idea
Think of {your topic} as {a simple comparison}. That one picture is enough to start with, and you can add the detail later, once the basics feel easy.
# Steps
First, **{step one}**. It takes about {time}.
Second, {step two}, so you can see {benefit}.
Third, {step three}, and now you have a result you can repeat. [breathe]
# Mistake
The most common mistake is skipping the second step because it feels slow. I did it for months, and I kept getting the same weak result. Slow is how it sticks.
# Close
That is the whole idea. If it helped, save this Short and send it to a friend who is stuck on {your topic}. [smile]`,
  },
  {
    id: 'starter-tiktok',
    name: 'TikTok starter: a quick story',
    presetId: 'tiktok',
    title: 'A quick story',
    aspect: '9:16',
    targetSeconds: 30,
    body: `# Hook
I tried {the thing} for {time}, and I was not ready for this.
# Story
I started because {the reason}. On day one, I honestly thought it was pointless, and I almost stopped. [pause]
# Turn
Then on day {number}, I noticed {the surprise}. That small moment changed how I do {your topic}, and I have not gone back.
# Close
Would you try it? Tell me in the comments, and I will post what happens next. [smile]`,
  },
  {
    id: 'starter-youtube',
    name: 'YouTube starter: the first 30 seconds',
    presetId: 'youtube',
    title: 'Your YouTube intro',
    aspect: '16:9',
    targetSeconds: 30,
    body: `# Hook
By the end of this video, you will know how to {the result}.
# Proof
I figured this out the hard way, after {what you tried} for {time}, so you can skip that part. [pause]
# Promise
We will go through {number} steps. First {step one}, then {step two}, and finally {step three}.
# Channel
I'm {name}, and on this channel I help {who you help} with {your topic}. Let's get started. [smile]`,
  },
  {
    id: 'starter-linkedin',
    name: 'LinkedIn starter: a lesson learned',
    presetId: 'linkedin-video',
    title: 'A lesson learned',
    aspect: '9:16',
    targetSeconds: 60,
    body: `# Hook
Here is a lesson from {number} years of {your work} that I wish I had learned sooner.
# Situation
Early in my career, I believed that {the common belief}. I worked that way for a long time. [pause]
# Turning point
Then {what happened}, and I had to admit it was not working.
# Lesson
What I do now is simple. **{The new habit}**. Every {time period}, I {the action}, and I write down what I learn.
# Result
It is not dramatic. It is steady. {The change you noticed} showed up within {time}, and it has held. [breathe]
# Takeaway
If you lead a team, or you are building a career in {your field}, ask yourself one question. What do you believe that you have never tested?
# Close
I would like to hear what you changed your mind about. Share it in the comments.`,
  },
];

export const starterById = new Map(starterScripts.map((s) => [s.id, s]));
