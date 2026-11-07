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
Hi, welcome in. I'm glad you found this channel. [smile]
# What I do
I make short videos that turn one hard thing into one easy step.
# Why it matters
Most people come here stuck, short on time, and tired of guessing. [pause]
# What to expect
Here you can expect short videos, plain words, and one useful idea every time.
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
If you keep starting things and never finishing them, try this one small change.
# Context
Most people try to do too much at once, and then they quit before it works. [pause]
# Value
Here is the fix. **Pick one thing**, and do it for seven days. Then check what changed, so you know it is working.
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
Here is the simplest way to learn any new skill faster.
# Problem
Most explanations start with the hard part, so people give up in the first minute. [pause]
# Idea
Think of a new skill like a staircase. You only need to see the next step, not the whole climb. That one picture is enough to start with.
# Steps
First, **pick the smallest version of the skill**. It takes about ten minutes.
Second, practice it every day for a week, so you can see real progress.
Third, add one new piece, and now you have a result you can repeat. [breathe]
# Mistake
The most common mistake is skipping the second step because it feels slow. I did it for months, and I kept getting the same weak result. Slow is how it sticks.
# Close
That is the whole idea. If it helped, save this Short and send it to a friend who is learning something new. [smile]`,
  },
  {
    id: 'starter-tiktok',
    name: 'TikTok starter: a quick story',
    presetId: 'tiktok',
    title: 'A quick story',
    aspect: '9:16',
    targetSeconds: 30,
    body: `# Hook
I tried waking up an hour earlier for thirty days, and I was not ready for this.
# Story
I started because my evenings kept disappearing. On day one, I honestly thought it was pointless, and I almost stopped. [pause]
# Turn
Then on day nine, I noticed I had finished a project I had put off for a year. That small moment changed how I plan my days, and I have not gone back.
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
By the end of this video, you will know how to plan a whole week of videos in one hour.
# Proof
I figured this out the hard way, after two years of planning one video at a time, so you can skip that part. [pause]
# Promise
We will go through three steps. First the idea list, then the outline, and finally the filming plan.
# Channel
On this channel I share simple systems that help you make more with less stress. Let's get started. [smile]`,
  },
  {
    id: 'starter-linkedin',
    name: 'LinkedIn starter: a lesson learned',
    presetId: 'linkedin-video',
    title: 'A lesson learned',
    aspect: '9:16',
    targetSeconds: 60,
    body: `# Hook
Here is a lesson from ten years of work that I wish I had learned sooner.
# Situation
Early in my career, I believed that working longer hours meant doing better work. I worked that way for a long time. [pause]
# Turning point
Then I burned out on a project I cared about, and I had to admit it was not working.
# Lesson
What I do now is simple. **I protect two focused hours every morning**. Every Friday, I look back at the week, and I write down what I learn.
# Result
It is not dramatic. It is steady. Better work showed up within a month, and it has held. [breathe]
# Takeaway
If you lead a team, or you are building a career, ask yourself one question. What do you believe that you have never tested?
# Close
I would like to hear what you changed your mind about. Share it in the comments.`,
  },
];

export const starterById = new Map(starterScripts.map((s) => [s.id, s]));

// The first-run quick script: real, speakable words, so the camera never opens on blanks.
export const FIRST_RUN_TITLE = 'Introduce yourself in 30 seconds';
export const FIRST_RUN_BODY = `Hi, welcome in. I'm glad you found me.

I make short videos with one useful idea at a time.

Stick around, and tell me what you want to see next.`;
