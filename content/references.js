/* =============================================================
   REFERENCES: your reading, as this site shows it.

   The books come from Goodreads. content/books.js is refreshed
   every morning with your shelves, ratings and reviews, so keep
   reading, rating and reviewing on Goodreads as usual.

   This file changes how a book appears HERE, without touching
   Goodreads. Each note is keyed by the book's Goodreads id: the
   number in its Goodreads link (goodreads.com/book/show/21 is "21").

     why       for a want-to-read book: why it's on your list
     line      a one-line takeaway, shown on the book's card
     hide      true keeps a book off this site (it stays on Goodreads)
     title, subtitle, author    tidier wording than the edition on Goodreads
     review    a proofread copy of your Goodreads review. It's used only
               while the review on Goodreads still says exactly what "was"
               says, so if you edit a review on Goodreads, your new words
               show here the next morning.

   Example:  "5129": { why: "The other half of the argument 1984 started." },
   ============================================================= */
window.NB = window.NB || {};

NB.references = {
  // The first lines on the References page.
  intro: "Everything I've finished since 2018, with the stars I gave it and what I wrote at the time. Synced from Goodreads every morning.",

  // "Start here": the books a visitor sees first, by Goodreads id, in this order.
  startHereTitle: "Five books that shaped me",
  startHere: [
    "21",        // A Short History of Nearly Everything
    "572918",    // Mastering Modern World History
    "40121378",  // Atomic Habits
    "29780253",  // Born a Crime
    "11084145"   // Steve Jobs
  ],

  notes: {
    // Tidier titles than the Goodreads editions
    "164581115": { // The Rise and Fall of the Third Reich
      subtitle: "A History of Nazi Germany"
    },
    "232559": { // Stochastic Calculus Models for Finance II
      subtitle: "Continuous-Time Models"
    },
    "232560": { // Stochastic Calculus for Finance I
      subtitle: "The Binomial Asset Pricing Model"
    },
    "1991": { // Why Is Sex Fun? The Evolution of Human Sexual...
      title: "Why Is Sex Fun?",
      subtitle: "The Evolution of Human Sexuality"
    },
    "20625812": { // An Indian Pilgrim (unedited)
      title: "An Indian Pilgrim"
    },
    "46014467": { // Operation X
      subtitle: "The Untold Story of India's Covert Naval War in Bangladesh"
    },
    "23513349": { // Milk and honey
      title: "Milk and Honey"
    },
    "9864913": { // Jaya
      subtitle: "An Illustrated Retelling of the Mahabharata"
    },

    // Proofread reviews: spelling, capitals and grammar only. Your words.
    "29044": { // The Secret History
      review: "Great writing style. I could feel every emotion deeply: sadness, despair, and the tragedy at the end.",
      was: "Great writing style. I could feel deeply every emotion of sad, despair, tragedy at the end."
    },
    "21": { // A Short History of Nearly Everything
      review: "Every sapien should read this.",
      was: "Every sapien should read this"
    },
    "186074": { // The Name of the Wind
      review: "I had high hopes. I thought of it as a mature version of Harry Potter. But it didn't click with me, I think.",
      was: "I had high hopes. I thought of it as a mature version of Harry potter. But it didn't clicked me i think."
    },
    "33124137": { // Pet Sematary
      review: "Dark. That's it.",
      was: "Dark. That's it"
    },
    "35133922": { // Educated
      review: "The most bizarre thing that I have ever read. But it is filled with inspiration and wisdom.",
      was: "the most bizzare thing that i have ever read. But it is filled with inspiration and wisdom.\""
    },
    "9275658": { // Legend
      review: "So I was looking for something fast-paced after I read Maggie's book, and it served the purpose.",
      was: "So i was looking for some fast paced thing after i read Maggie's book. So it served right"
    },
    "10626594": { // The Scorpio Races
      review: "So, I have read a book after many months. I am lucky that I picked one of Maggie's books, because now I am hooked on reading more. It feels similar to the capall uisce's love for the sea.",
      was: "So, i have read after many months. I am lucky that picked one of Maggie's book. Because now I am hooked on reading more. It feels similar to love of capall uisce for sea."
    },
    "29780253": { // Born a Crime
      review: "Best book I have ever read. The best thing about this book is that not for a single moment do you feel it's going slow. You will enjoy every page you read. Even better, there is an audiobook read by Trevor Noah himself. When I heard about it, I was like, I wanna lay my hands on it. It was really good, and it also gives you a new perspective on life. It was very emotional too: the best mother and child ever. It teaches you to struggle.",
      was: "Best Book I have ever read.the best about this book is that not in a single moment you feel it's going slow. Every page you read you will enjoy it. The best thing is that their is audiobook which is read by Trevor Noah himself. When I heard about it I was like I wanna lay my hands on it. It was really good and it also gave you new perspective in life. It was very emotional too best mother and child ever. It teaches you to struggle"
    },
    "14061955": { // Siege and Storm
      review: "This is my favourite of the series. The first part was quite slow, but the whole escape adventure was amazing. When Sturmhond entered, it became exciting. Pirates of the Caribbean is one of my favourite movies, so I love the Jack Sparrow-like character. The twist was also good. I became more attached to Nikolai than to Alina, so I liked the whole part when Nikolai was there. But slowly his importance eroded again, and I kind of lost interest. I still don't like the Darkling as a villain. I think it is my personal bias, as I have seen way too many Alina and Darkling edits. I am kind of in awe of the Darkling. He seems logical. So I didn't like the end, where he is shown as some monster. I didn't like the easy victory either. In the end it is back to square one, as Alina is on the run again. So I will give this series a break and read the third part after some time.",
      was: "This is my favorite of the series. The first part was quite slow but the whole adventure of escape was amazing. But when Sturmhond entered it became exciting. Pirates of carribbean is one of my favourite movie. So i love the jake sparrow like character. The twist was also good. I became more attachment to Nicolai compared to Alina. So i liked whole part when Nicolai was there. But slowly again his importance was eroded and i kind of lost my interest. I am still not liking darkling as a villain. I think it is my personal bias as i have seen way many alina and darkling edit. I kind of in awe with darkling. He seem logical. So i didn't like the end where he is shown like some monster. I didn't like the easy victory. In the end it become back to square one. As again alina is on run. So i will give this series a break and will read 3rd part after some time."
    },
    "10194157": { // Shadow and Bone
      review: "So, it has been a long time since I picked up a book. When the rains started here in Mumbai, I don't know why, but I had a strong urge to read. I was getting flashbacks of The Hunger Games and Twilight. With each breeze I felt a longing for a good book. So I did a bit of research and picked this book. It was good. I won't say it was as electric as The Hunger Games (I am biased). I like the whole plot, but I didn't feel any awe for the Grisha and their small science. The Unsea was awesome. I also liked the plot twist, but it didn't give me any chills. So it was a good book to read, but I didn't connect with any character or get chills like I got when I read Stephen King's books. I think it will take time to get connected, so I am continuing with the next part.",
      was: "So, i have been long time since I picked a book. When rain started here in mumbai, i don't know why i had a strong urge to read. I was getting flashbacks of hunger game and twilight. With each breeze i felt a longing for a good book. So i did a bit of research and picked this book. It was good. I won't say as electric as hunger games (I am baised). I like the whole plot. But i didn't felt any awe for grisha and their small science. Un sea was awesome. I also liked the plot twist. But it didn't gave me any chill. So it was a good book to read. But i didn't got connected with any character or got chills. Like i got when i read Stephen king books. I think it will take time for getting connected. So i am continuing with next part"
    },
    "53138081": { // The Four Winds: softened for the site (your call, 20 Oct 2026)
      review: "I didn't like it much, and I know that's partly my own bias. Whenever I read about the hardships of the Great Depression, I kept remembering the Great Bengal Famine. It happened during the Second World War, under a British government led by Winston Churchill, who spoke of Indians with open contempt. The war years were when America prospered. And in 1971, when the Pakistani army was brutalising East Bengal and millions fled to India, the US sent its navy in support of Pakistan. I also couldn't buy the book's picture of the proud, hard-working farmer. The land wasn't empty: it was home to Native Americans, who were pushed off it, and the bison their livelihood depended on were killed. So I just didn't connect with the story.",
      was: "I didn't like it much because of my own biasness. Whenever i read about the hardships of people in great depression i remembered about great bengal famine. It happened in period of second world war when British government thought Indians as animals who procreate like a rabbit's. That's literally the statement of British prime minister Winston Churchill. He is regarded as hitler in India. So what this has to do with America. The second world war is the time when they Prospered and when in 1971 the same bengal was being raped by Pakistani army USA supported it. There was mass migration towards india at that time as whole of East Bengal was in fire. Whole inteligencia was being killed so that no freedom movement will emerge. What US did is send it's navy to support that. It was stopped by soviet submarines. That's why Indians have a positive image of Russia and support it in present circumstances. Also the whole hard working proud farmer stuff was full bullshit. They came to the land not empty but settled by native Americans. Who hard to retreat when Europeans came to there land. They not only tilled there soil but killed the bison on whom there livelihood was depended. So i just didn't connected to the story."
    },
    "11588": { // The Shining
      review: "It is a good book. But I didn't get the Stephen King feeling, as I was with my homie, so reading horror was kind of a bad choice. Next time I will try to read it in a suitable setting.",
      was: "It is a good book. But i didn't get the Stephen king feeling as i was with my homie. So reading horror is kind of a bad choice. Next time when i read i will try to read in a suitable setting."
    },
    "33516773": { // Big Little Lies
      review: "Good book, but I was not able to connect. It seems a little slow, but it picks up pace in the second half. There is also a lot of suspense, and the revelations are awesome. It also talks a lot about domestic violence and the abuse of women. If you are into this kind of stuff, do read it.",
      was: "Good book but i was not able to connect. It seems a Little slow. But it picks pace at the second half. There is also a lot of suspense and their revelations are awesome. It also talks alot of domestic violence and women abuse. If you are into this kind of stuff do read it."
    },
    "49110169": { // One Bright Moon
      review: "This book was recommended to me by Matt (a YouTuber). What he got from this book was gratitude for what he has. But for me it was inspiration. I was even able to relate to the story. Andrew was born in Shiqi, a town in China; I was born in Ulhasnagar, a town in India. I was able to connect with the story, as Indians and Chinese are similar. It was also wonderful to read a success story that I want to be mine one day. But the thing I don't like is his lack of patriotism. In this whole book he seems to portray China as the villain and the West as a paradise, which is not fair. He portrays Australia as heaven on earth, but if you ask an Aboriginal person there, you will get a bigger picture. But I can't blame him for that: after facing the Great Leap Forward, anybody would have that opinion. So, to conclude, it is surely a great read.",
      was: "This Book was recommended to me by matt (youtuber). What he got from this book was gratitude for what he has. But for me it was inspiration. I was even able to relate to his story. Matthew was born in Shiqi a town in china. Me being born in Ulhasnagar a town in India. I was able to connect to the story as Indian & Chinese are similar. It was also wonderful to read a success story which I want one day to be mine. But the thing which i don't like is his lake of patriotism. In this whole book he seems to portray china as the villian & west as a paradise. Which is not fair. He portrayed Australia as a heaven on earth. But if you ask a aborigine there you will get a bigger picture. But i can't blame him for that after facing great leap forward anybody will have that opinion. So to conclude it is surely a great read."
    },
    "40961427": { // 1984
      review: "I don't know what to say about this book. But in one line: it is very depressing. I liked only the part with Winston and Julia together. The rest seems to have no life in it. Take caution: don't read it if you are having a hard time. It is in no way merely a fiction novel. It deals with society, authority and thought. Anyone interested in those things will find this book intriguing. So that's it.",
      was: "I don't know what to say about this book. But in one line, it is very depressing. I liked only part of Winston and Julia together. Rest is seems to contain no live in it. Take caution don't read it if are having a hard time. It is in no way merely a fiction novel. It deals with society, authority and thought. The person who is interested in those things can find this book intriguing. So that's it."
    },
    "10618": { // Apt Pupil
      review: "Creepy as hell.",
      was: "Creepy as hell"
    },
    "11574": { // The Body (Penguin Readers, Level 5)
      title: "The Body",
      author: "Stephen King",
      review: "Awesome. I have been hustling too much, so I decided to take a break and read. So I read another Stephen King, and he never disappoints. This is the third time he has taken me out of mental fatigue. Now I'm feeling fresh and ready to dive back into work.",
      was: "Awesome. I have been hustling too much. So I decided to take a break and Read. So i read another Stephen king and he never disappoint. This is third time he took me out of mental fatigue. Now feeling fresh and ready to dive back at work again."
    },
    "31362725": { // The Lawnmower Man
      review: "Very short. Not able to get into the plot, if there was one.",
      was: "Very short. Not able to get into the plot if there was one."
    },
    "17378508": { // Blue Lily, Lily Blue
      review: "Best in the series. Colin Greenmantle was an amazing character; I hope he returns in book four. Maggie's writing style is good. At first I thought it was like King's, but she has her own unique style. It grows on you as you read her books. Piper is also good. There was less Ronan and Gansey, but it was still good. Now Blue seems cool. I hope there is more Gansey and Blue stuff in book four. So, it was a great read.",
      was: "Best in the series. Colin Greenmantle was amazing character I hope he returns in book four. Maggie's writing style is good. First I thought it's like king's. But she have her own unique style. It seems to grow on you as you read her books. Piper is also good. There was less Ronan and gansey but still good. Now blue seems cool. Hope there is more gansey and blue stuff in book 4. So, it was a great read."
    },
    "17378527": { // The Raven King
      review: "The beginning was not magical. But from the second half, it became something no words can describe. There are times when you feel strongly. Every emotion is amplified. You feel sorrow like dread, happiness like bliss, and every other emotion at its most intense. This happened to me a lot while reading this book. I felt the same when Gansey died as I felt when Harry was going to sacrifice his life. But that time I had moved somewhere private, so that people wouldn't see my face in that state. I read The Raven King in a public library, so while reading I was constantly trying to keep a straight face. So you can see the level of magic in the book. You see, I can't describe the book well. I can only say how I felt while reading it. If you want a short answer, I would say:\n\nThere is\nMAGIC (a lot of it)\n& GANSEY\nThen there is\nRONAN (a lot of it too)\n& Chainsaw.\nAt last there is\nBLUE, & she has a special power of killing her true love with a kiss.\n\nThat sums it up well.\nThis is also my first book of the year.",
      was: "The starting was not magical. But from the second half it became something no word can describe. There are sometimes when you feel strongly. Every emotion is amplified. You feel sorrow like dread, happiness like bliss, and every other emotion to its most mature like. This happen to me alot while reading this book. I felt same when gansey died as I felt when Harry was going to sacrifice his life. But that time I have moved to some place private so that people won't see my face in that state. But I read raven king in a public library so while reading I was constantly trying to keep my face straight. So you can see the level of magic of the book. So you see I can't well describe the book. I can only say how I felt while reading this. If you want a short answer. Then I would say.\n\nThere is\nMAGIC (a lot of it)\n& GANSEY\nThen there is\nRONAN ( alot of it too)\n& Chainsaw.\nAt last there is\nBLUE & she has a special Power of killing her true love by kiss.\n\nThat sums it well.\nThis is also my first book of the year."
    },
    "5211": { // A Fine Balance
      review: "Bad ending. Very depressing. I read it because the story is set in Mumbai, where I live.",
      was: "Bad ending. Very depressing. Read it because story was based in Mumbai. Were I live."
    },
    "40121378": { // Atomic Habits
      review: "This book literally changed my opinion of the self-help genre. I am hooked. What makes this book good is that it can be applied right after reading it. This book is mostly about building systems rather than goals. It teaches you how to build systems, because you can't rely on willpower to do everything. If some things get automated, you can do new stuff. For example, waking up early used to be difficult for me. Then I started reading this book, and I promised myself to apply something from it. So I decided to wake up at 5:30. I actually woke up at 5:38. I was delighted, but it took me a lot of willpower to do it. For four days, waking up at 5:30 was my main goal. I was paranoid about missing the alarm. I even woke at midnight at slight noises to check what time it was. But after a week it had become a daily part of life. It seems like no accomplishment to do it, just like having breakfast. Now I am focused on other goals, like reading more books, studying more and having a healthy body. I also used temptation bundling to make exercise and running a morning habit too. I can do 5K now. So this book was a game changer for me. I will revisit it many times to get the most out of it.",
      was: "This book literally changed my opinion about self-help genre. I am hooked. What makes this book good is that it can be applied right after reading it. So this book is mostly about building systems rather than goals. It teaches you how to build systems. Because you can't rely on willpower to do everything. If some things get automate you can do new stuff. Like previous waking up early was difficult for me. Then I started reading this book. I promise myself to apply something from this book. So I decided to wake up at 5:30. I actually woke up at 5:38. I was delighted, but it took me alot of will power to do it. For 4 days waking up at 5:30 was my main goal. I was paranoid to miss the alarm. I even woke at midnight by slight noises to see what is it time. But after a week it has become daily part of life. Seems no accomplishment to do it, just like having breakfast. Now I am focused on other goals like reading more book, studying more and Having a healthy body. I also to used temptation bundling to make exercise & running too a habit at morning. Can do 5k now. So this book was game changer for me. I will revisit it many times to take most out of it."
    },
    "572918": { // Mastering Modern World History
      review: "So this is the longest book I have read till now. The audiobook is 40 hours long. It is a treasure for those who are interested in the question of how the present-day world came to be. It talks mostly about the 20th century and current circumstances. It has a very good writing style. Sometimes I felt overwhelmed by a lot of data, but I think that is necessary. This book is now my pillar of global understanding. Anyone interested in topics like history, politics, economics and geopolitics should pick up this book. It is worth the investment.",
      was: "So this is the longest Book I have read till now. The audiobook length is 40 hours. It is treasure for those who are interested in question, how this present day world came to be. It talks about mostly about 20th century & current circumstances. It has a very good writing style. Sometimes I felt too overwhelmed by alot of data. But I think that is necessary. This book is now my pillar of global understanding. Anyone interested in topics like history, politics, economy, Geopolitics should pick this book. It is worth the investment."
    },
    "11084145": { // Steve Jobs
      review: "⚠️ WARNING ⚠️\n\n*BEWARE OF THE REALITY DISTORTION FIELD*\n\nAt first I was sceptical about how this book was going to be. It was huge for my capacity, but the author's good writing style helped me through it. I literally didn't know anything about him when I started reading it. I read it because Elon Musk recommended it, and because he was the CEO of Apple, which is a trillion-dollar company. It was totally worth it. I loved it from the beginning; I even called my friend and told him what I had learned. I also became interested in electronics. Then there was the second part, where I started wondering why I can't do this. I was totally impressed by his passion for things. My life seems kind of dull compared to his. I felt the urge to be like him, to become passionate about what I do. I think in childhood we were all passionate about different things; then, as we grow up, we start to give more importance to end results than to the journey. Now there are very few things I am interested in; the rest feels like a chore. I want to change this, and I am working on it. The third thing is that it totally changed my perspective on things. At first I was hyped up about totally changing everything. But we all know how that turns out. Still, I gained a lot of knowledge, which I will hopefully use in my life. Whoever is thinking about reading this book: just pick it up, even if you don't want to start a company. I myself want to join the military.\n*Sorry for any grammatical mistakes*",
      was: "⚠️ WARNING ⚠️\n\n*BE AWARE OF REALITY DISTORTION FIELD*\n\nAt first I was sceptical of how this book is going to be. It was huge according to my capacity. But author's good writing style helped me through that. I literally didn't know anything about him when I started reading it. I read it because Elon musk recommend it and as he was ceo of apple which is a trillion dollar company. It was totally worth it. I loved it from the beginning I even called my friend and told him about what I had learned. I also became interested in electronics. Then there was the second part where I started thinking that why I can't do this. I was totally impressed by his passion for things. My life seems kind of dull compared to him. I felt the urge to be like him to become passionate in what I do. I think in childhood we all were passionate about different things then as we grow up we start to give importance to end results than the journey. Now there are very few things that I am interested in rest feels like a chore. I want to change this and I am working on it. Third thing is that it totally changed my perspective on my things. At first I was hyped up on totally changing everything think. But we all know how that turns out. But I gained alot of knowledge which I will hopefully use in my life. Whoever is thinking about reading this book just pick it even if you don't want to start a company. I myself want to join military.\n*Sorry if there is any grammatical mistakes*"
    },
    "20776100": { // I Know What You Need
      review: "It was good, but not Stephen King level.",
      was: "It was good. But not Stephan king level"
    },
    "10575": { // Stationary Bike
      review: "As always, Stephen King never fails to send chills down the spine. I can now say for sure that he is my favourite author. This book is amazing. You can read it in an hour and experience the Stephen King world. That's it.",
      was: "As always Stephen king never failed to sent chills down the spine. I can now say for sure that he is my favourite author. This book is amazing. You can read it in an hour and experience the Stephen king world. That's it."
    },
    "17675462": { // The Raven Boys
      review: "This was amazing. Nothing more to add.",
      was: "This was amazing. Nothing more to add"
    },
    "41721428": { // Can't Hurt Me
      review: "I am now officially going to replace the words 'hard work' with 'David Goggins' in my dictionary. He really deserves this. He literally came from nothing and did unimaginable things. His childhood was full of trauma, and his foundation was nothing. But by sheer will he was able to turn his life around. Still, I don't agree with many things in the book. The author over-emphasises willpower. I have tried those things in my life in the past, and they don't work in the long run. Then he says life is all about goals: you should always focus on the next challenge life throws at you. I agree that you should be serious about your mission in life. But life is not all about goals, missions or the next deadline. It is more about how you live it. I have lived in that state where you only think about the one thing you want to accomplish. By doing so, you neglect your relationships with friends, family and others around you. You also start to loathe the current state of your life, and you want to change it all at once. I think that never happens, because there will always be something more. So let's see the big takeaways from this book:\n\nInspiring stories of struggle and hard work.\nYou can succeed no matter what background you come from.\nYou can achieve things that are hard to believe even in dreams.",
      was: "I am now officially going to change the word hard work to david gogins in my dictionary . He really deserves this. He literally came from nothing and did unimaginable things. His childhood is full of tramas and his foundation was nothing. But by his sheer will he was able to turn his life around. But I don't agree with many things in the book. Author over emplassis on will power. I have tried those things in my life in the past and they don't work in the long run. Then he says life is all about goals. You should always focus on the next challenge life throws at you. I agree that you should be serious about your mission in life. But life is not all about goals, mission or another deadline to accomplish. It is more about how you live it. I have lived in that state where you just think about one thing that you want to accomplish. By doing so you neglect your relationships with friends, families and others those surrounds you. You also start to loath the current state of your life and you want to change it all at onces. I think that never happens because there will always be something more. So let's see big takeouts from this book.\n\nInspiring stories of struggle and hard work.\nYou can succeed no matter what background you come from.\nYou can achieve things that are hard to even believe in dreams."
    },
    "389627": { // Diary of a Wimpy Kid
      review: "I just read it to get some nostalgia for my school days. But as an Indian, I was not able to relate to the book.",
      was: "I just read it to get some nostalgia of my school days. But as an Indian I was not able to relate with the book."
    },
    "11573": { // The Dead Zone
      review: "This is my second Stephen King book, and I will say he never stops amazing me. This review is going to be more about my personal experience than a plain review. I bought this book a year ago and tried to read it, but it was too heavy for me back then, so I stopped. After that I read many other books. Then one day I was studying for my midterms and was exhausted, so I decided to read something. I got a recommendation from Goodreads: The Breathing Method. It was short, so I read it in one sitting in the public library where I was studying. Even the weather helped me get into the plot. There were clouds, thunderstorms and a cool breeze. I still remember that when I was reading the cab driver part, the breeze came and sent chills down my spine. After finishing that book I was in a trance, like you get when you watch a good sci-fi movie. Then I remembered that I had one more Stephen King book on my shelf, so I started reading The Dead Zone. The majority of the books I have read are from the YA genre, so reading Stephen King was hard. But as I got into the plot, it became a wonderful experience. There were many moments in the book that gave me that kind of feeling I can't express in words. Stephen King's main speciality is building characters. The character building of Frank Dodd (the rapist) was amazing. It was very scary, especially the end scene. Do not read it at night if you want to sleep peacefully. I read the graduation party scene at night: the best scary experience in a long time. The ending is very tragic, but it was expected. So, in short, the only thing you are going to regret is not becoming a reader earlier in life.",
      was: "This is my second Stephen King book and I will say he never stops to amaze me. This review is going to be more about my personal experience than a plane review. So I bought this book a year ago and tried to read it but it was too heavy for me back then. So I stopped. Then after that I read many books. Then one day, I was studying for my midterms and was exhausted. So I decided to read something. I got a recommendation from Goodreads which was The breathing method. It was short so I read it in one sitting in the public library where I was studying. Even the weather helped me to get into the pilot. There were clouds, thunderstorms and cool breeze. I still remember when I was reading the cab driver part the breeze came and sent chills to my spine. After completing that book I was in a trance state. Like you get when you watch a good sci fi movie. Then I remembered that I have one more book of Stephen King on my shelf. So I started reading the dead zone. Majority of the books that I have read are from the YA genre so reading Stephen king was hard. But as I got into the plot it became a wonderful experience. There were many moments in the book that got me into that kind of feeling which I can't express in words. The main Specialty of Stephen king is build characters. The character building of Frank Dodd (The rapist) was amazing. It was very scary. Especially the end scene.do not read it at night if you want to sleep peacefully. I read the graduation party scene at night. Best scary experience in a long time. Ending is very tragic but it was expected. So in short the only thing you are going to regret is not to become a reader early in life."
    },
    "170448": { // Animal Farm
      review: "⚠️ DISCLAIMER ⚠️\n\n*a very sad story*\n\nThis is the best and easiest explanation of what happens to a country when communism arrives. At first I thought it was just a satire of communism, but the story is well written. You can easily relate the characters in this story to their real-life counterparts. In the end it became very emotional too. It touched me, as I belong to India, where sadly corruption is a big problem. I have heard stories from my family of people in my locality rising from nothing to huge sums of money by fooling people. But I am still proud that we have a fair democracy. I hope things will change.",
      was: "⚠️ DISCLAIMER ⚠️\n\n *a very sad story*\n\nThis is best and easiest explanation of what happens to a country when communism arrives. At first I thought it was just a satire against communism. But the story is well written. A person can easily relate characters in this story and their real life counterparts. At last it became very emotional too. It touched me as I belong to India where sadly corruption is a big problem. I have heard stories from my family of people rising from nothing to having huge sums of money by fooling people in my locality. But still proud that we have a fair democracy. I hope things will change."
    },
    "81959": { // As a Man Thinketh
      review: "I think I wasn't in the right frame of mind to get the point, so I will reread it soon. There were nice proverbs in here, so you can read it for those.",
      was: "I think I read it not in the right mind to get the point. So I will reread it soon. There were nice proverbs in here. So you can read that."
    },
    "8664353": { // Unbroken
      review: "Best book for those searching for a story with a life lesson. I was interested in history and wars, so I read it. It gives you great insight into what happened in the world war, from a personal point of view. If you are lost or feeling uncertain about anything, just read this book and it will definitely give you hope. Disclaimer for those who waste food: you will feel very guilty after reading this.",
      was: "Best book for those searching for a fiction with a life lesson. I was interested in history and wars so I read it. It gives you a great insight of want happened in world war from a personal view. If you are lost or feeling uncertain about anything just read this book and it will definitely give you hope. Disclaimer for those who waste food: you will feel very guilty after reading this"
    },
    "10580": { // A Winter's Tale
      review: "The first Stephen King book I read. It was awesome, and even the environment I read it in suited this book well. There is a public library in my town where I go to study. I felt bored, so I decided to read something. Then I began reading this book and went into that feeling you get while reading this type of book. Then the lights went off. They came back after half an hour, but it had done its job. I would suggest reading it in one go, in a good setting.",
      was: "First book that I read of Stephen king. It was awesome even the environment in which I read it was well suited for this book. There is a public library in my town where I go for studies. I felt bored so I decided to read something.Then I begin reading this book. I when into that feeling that you get while reading this type of books. Then light went off. It came back after half an hour but it did it's job. I would suggest to read it in one go in a good setting."
    },
    "51901147": { // The Ballad of Songbirds and Snakes: one word softened (your call)
      review: "I don't know what to make of this book. Did I like it? Can't say. But the plot was amazing, as it was a Hunger Games book. That's why I started reading it despite all the negative reviews. It is not a love story like The Hunger Games trilogy; it's the backstory of a villain. At the beginning I liked Snow's character: poor, but trying hard to succeed. That's where I connected with the book. I also loved Lucy Gray and her songs (do watch the videos made by fans on YouTube). But this book is deeply depressing. Please don't read it when you are low. There was adventure, which I liked, but the end is very twisted. I am not even able to express my opinion about the book, so I am going to wrap it up in one line: if you liked the Hunger Games plot, then read it; otherwise, leave it.",
      was: "I don't know what to make out from this book. Did I like? Can't say. But the plot was amazing as it was a Hunger game book. That's why I started reading it against all the negative reviews. It is not a love story like hunger games trilogy. It's a back story of a villian. At the beginning l liked snow's character. Poor but trying had to succeed. That's where I connect myself with book. I also loved Lucy Gray and her song's ( do watch videos made by fans on YouTube). But this book is fucking depressing. Please not read when you are low. There was adventure which I liked but end is very twisted. I am not even able to express my opinion about the book. So I am going to wrap it in one line. If you liked hunger games plot then read it or otherwise leave it."
    },
    "11870085": { // The Fault in Our Stars
      review: "A heart-touching love story.",
      was: "Heart touching love story."
    }
  }
};
