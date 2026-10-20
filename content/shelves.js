/* =============================================================
   SHELVES: which shelf each book sits on. Decided here, by what
   the book is actually about, not by your Goodreads shelves.

   The first genre is the shelf it physically sits on (and the
   section it appears in). Any others make it findable under those
   filters too. "india" is a thread, not a shelf: books by Indian
   writers or about India, whatever their genre.

   A new book from Goodreads shows under "Still to be shelved" until
   you add its Goodreads id here. The morning sync lists any such
   books in its summary on GitHub.

   "short" is the name written on the guide card where the genre
   starts on the bookcase.

   The same genre keys work as "topics" for films, articles, courses,
   videos and podcasts in content/references.js.
   ============================================================= */
window.NB = window.NB || {};

NB.shelves = {
  families: [
    { key: "stories", label: "Stories" },
    { key: "ideas", label: "Ideas" },
    { key: "threads", label: "Threads" }
  ],
  genres: [
    { key: "fantasy", family: "stories", label: "Fantasy", short: "Fantasy", color: "#2E5A44" },
    { key: "paranormal", family: "stories", label: "Paranormal & urban fantasy", short: "Paranormal", color: "#3B3F4A" },
    { key: "scifi", family: "stories", label: "Science fiction & dystopia", short: "Sci-fi", color: "#4F6D8F" },
    { key: "horror", family: "stories", label: "Horror", short: "Horror", color: "#7A2E2A" },
    { key: "thriller", family: "stories", label: "Thriller & mystery", short: "Thrillers", color: "#4B3C5E" },
    { key: "literary", family: "stories", label: "Literary & historical fiction", short: "Literary", color: "#1F3354" },
    { key: "classics", family: "stories", label: "Classics", short: "Classics", color: "#6E4B2A" },
    { key: "comingofage", family: "stories", label: "Coming-of-age", short: "Coming-of-age", color: "#B9822F" },
    { key: "romance", family: "stories", label: "Romance", short: "Romance", color: "#A8506A" },
    { key: "myth", family: "stories", label: "Myths & retellings", short: "Myths", color: "#A8542F" },
    { key: "history", family: "ideas", label: "History & geopolitics", short: "History", color: "#8A6A3B" },
    { key: "war", family: "ideas", label: "War & the military", short: "War", color: "#586B36" },
    { key: "lives", family: "ideas", label: "Biography & memoir", short: "Lives", color: "#B79F70" },
    { key: "science", family: "ideas", label: "Science & mathematics", short: "Science", color: "#2F6E72" },
    { key: "tech", family: "ideas", label: "Technology, data & AI", short: "Tech & AI", color: "#35577D" },
    { key: "money", family: "ideas", label: "Business, money & economics", short: "Money", color: "#9A7B1F" },
    { key: "mind", family: "ideas", label: "Mind, habits & productivity", short: "Mind", color: "#7C5C8C" },
    { key: "philosophy", family: "ideas", label: "Philosophy & meaning", short: "Philosophy", color: "#5B4636" },
    { key: "craft", family: "ideas", label: "Writing & poetry", short: "Writing", color: "#8C3B5E" },
    { key: "india", family: "threads", label: "India", short: "India", color: "#D9822B", thread: true }
  ],
  books: {
    // ---------- Fantasy ----------
    "68428": ["fantasy"],                    // Mistborn: The Final Empire, Sanderson
    "68429": ["fantasy"],                    // The Well of Ascension
    "2767793": ["fantasy"],                  // The Hero of Ages
    "10803121": ["fantasy"],                 // The Alloy of Law
    "16065004": ["fantasy"],                 // Shadows of Self
    "18739426": ["fantasy"],                 // The Bands of Mourning
    "23947089": ["fantasy"],                 // The Lost Metal
    "68427": ["fantasy"],                    // Elantris
    "7235533": ["fantasy"],                  // The Way of Kings
    "186074": ["fantasy"],                   // The Name of the Wind, Rothfuss
    "3": ["fantasy", "comingofage"],         // Harry Potter and the Sorcerer's Stone
    "15881": ["fantasy", "comingofage"],     // ... Chamber of Secrets
    "5": ["fantasy", "comingofage"],         // ... Prisoner of Azkaban
    "6": ["fantasy", "comingofage"],         // ... Goblet of Fire
    "2": ["fantasy", "comingofage"],         // ... Order of the Phoenix
    "1": ["fantasy", "comingofage"],         // ... Half-Blood Prince
    "136251": ["fantasy", "comingofage"],    // ... Deathly Hallows
    "10194157": ["fantasy"],                 // Shadow and Bone, Bardugo
    "14061955": ["fantasy"],                 // Siege and Storm
    "17675462": ["fantasy", "comingofage"],  // The Raven Boys, Stiefvater
    "17347389": ["fantasy", "comingofage"],  // The Dream Thieves
    "17378508": ["fantasy", "comingofage"],  // Blue Lily, Lily Blue
    "17378527": ["fantasy", "comingofage"],  // The Raven King
    "10626594": ["fantasy", "romance"],      // The Scorpio Races
    "27774758": ["fantasy"],                 // An Ember in the Ashes, Tahir
    "25558608": ["fantasy"],                 // A Torch Against the Night
    "15790883": ["fantasy"],                 // Promise of Blood, McClellan
    "43575115": ["fantasy"],                 // The Starless Sea, Morgenstern
    "2213661": ["fantasy", "comingofage"],   // The Graveyard Book, Gaiman

    // ---------- Paranormal & urban fantasy ----------
    "345627": ["paranormal"],                // Vampire Academy, Mead
    "2282133": ["paranormal"],               // Frostbite
    "2802316": ["paranormal"],               // Shadow Kiss
    "5996153": ["paranormal"],               // Blood Promise
    "6479259": ["paranormal"],               // Spirit Bound
    "6527740": ["paranormal"],               // Last Sacrifice
    "8709527": ["paranormal"],               // Bloodlines
    "8709523": ["paranormal"],               // The Golden Lily
    "8709526": ["paranormal"],               // The Indigo Spell
    "9833184": ["paranormal"],               // The Fiery Heart
    "8709524": ["paranormal"],               // Silver Shadows
    "8709528": ["paranormal"],               // The Ruby Circle
    "41865": ["paranormal", "romance"],      // Twilight, Meyer
    "49041": ["paranormal", "romance"],      // New Moon
    "428263": ["paranormal", "romance"],     // Eclipse
    "1162543": ["paranormal", "romance"],    // Breaking Dawn
    "71811": ["paranormal"],                 // Moon Called, Briggs

    // ---------- Science fiction & dystopia ----------
    "2767052": ["scifi"],                    // The Hunger Games
    "6148028": ["scifi"],                    // Catching Fire
    "7260188": ["scifi"],                    // Mockingjay
    "51901147": ["scifi"],                   // The Ballad of Songbirds and Snakes
    "13599993": ["scifi"],                   // Divergent, Roth
    "11735983": ["scifi"],                   // Insurgent
    "9275658": ["scifi"],                    // Legend, Marie Lu
    "13414446": ["scifi"],                   // Prodigy
    "14290364": ["scifi"],                   // Champion
    "40961427": ["scifi", "classics"],       // 1984, Orwell
    "5129": ["scifi", "classics"],           // Brave New World, Huxley
    "10644930": ["scifi", "thriller"],       // 11/22/63, King: time travel to stop Dallas

    // ---------- Horror ----------
    "10629": ["horror"],                     // Christine, King
    "33124137": ["horror"],                  // Pet Sematary
    "11588": ["horror"],                     // The Shining
    "11573": ["horror", "thriller"],         // The Dead Zone
    "10618": ["horror", "thriller"],         // Apt Pupil
    "10580": ["horror"],                     // The Breathing Method (retold for Penguin Readers)
    "11572": ["horror"],                     // Quitters, Inc.
    "17826887": ["horror"],                  // Children of the Corn
    "31362725": ["horror"],                  // The Lawnmower Man
    "16122067": ["horror", "scifi"],         // I Am the Doorway
    "20776100": ["horror"],                  // I Know What You Need
    "10575": ["horror"],                     // Stationary Bike
    "34466922": ["horror"],                  // Sleeping Beauties, Stephen & Owen King

    // ---------- Thriller & mystery ----------
    "33516773": ["thriller"],                // Big Little Lies, Moriarty
    "41639186": ["thriller", "india"],       // The Girl in Room 105, Bhagat
    "1611988": ["thriller"],                 // A Prisoner of Birth, Archer
    "968": ["thriller"],                     // The Da Vinci Code
    "2429135": ["thriller"],                 // The Girl with the Dragon Tattoo
    "18597047": ["thriller", "myth", "india"], // The Mahabharata Secret, Doyle
    "61280583": ["thriller", "india"],       // The Psycho Professor: guessed from the title; nothing published about it online

    // ---------- Literary & historical fiction ----------
    "29044": ["literary", "thriller"],       // The Secret History, Tartt
    "4929": ["literary", "fantasy"],         // Kafka on the Shore, Murakami
    "17803": ["literary"],                   // After Dark, Murakami
    "5211": ["literary", "india"],           // A Fine Balance, Mistry
    "33917": ["literary", "india"],          // The Namesake, Lahiri
    "53138081": ["literary"],                // The Four Winds, Hannah
    "78983": ["literary"],                   // Kane & Abel, Archer
    "39664": ["literary"],                   // Rita Hayworth and Shawshank Redemption, King
    "18144590": ["literary", "philosophy"],  // The Alchemist, Coelho
    "34051011": ["literary"],                // Pachinko, Min Jin Lee
    "34066798": ["literary"],                // A Gentleman in Moscow, Towles
    "19063": ["literary"],                   // The Book Thief, Zusak
    "41880609": ["literary"],                // On Earth We're Briefly Gorgeous, Vuong
    "58573636": ["literary", "india"],       // Asoca: A Sutra, Sealy (Emperor Ashoka)

    // ---------- Classics ----------
    "7126": ["classics"],                    // The Count of Monte Cristo, Dumas
    "7190": ["classics"],                    // The Three Musketeers, Dumas
    "3836": ["classics"],                    // Don Quixote, Cervantes
    "6185": ["classics", "romance"],         // Wuthering Heights, Brontë
    "117833": ["classics", "fantasy"],       // The Master and Margarita, Bulgakov
    "2657": ["classics", "comingofage"],     // To Kill a Mockingbird, Lee
    "170448": ["classics"],                  // Animal Farm, Orwell: political satire

    // ---------- Coming-of-age ----------
    "11574": ["comingofage"],                // The Body, King (retold for Penguin Readers)
    "22628": ["comingofage"],                // The Perks of Being a Wallflower
    "99561": ["comingofage", "romance"],     // Looking for Alaska, Green
    "35504431": ["comingofage"],             // Turtles All the Way Down, Green
    "389627": ["comingofage"],               // Diary of a Wimpy Kid
    "105576": ["comingofage", "india"],      // Five Point Someone, Bhagat
    "3320520": ["comingofage", "india"],     // The 3 Mistakes of My Life, Bhagat
    "6572824": ["comingofage", "war", "india"], // Boots Belts Berets, Podder (military academy)

    // ---------- Romance ----------
    "11870085": ["romance", "comingofage"],  // The Fault in Our Stars
    "15745753": ["romance", "comingofage"],  // Eleanor & Park
    "33648131": ["romance"],                 // The Notebook, Sparks
    "10818853": ["romance"],                 // Fifty Shades of Grey
    "12615008": ["romance", "india"],        // Revolution 2020, Bhagat
    "30817225": ["romance", "india"],        // Everyone Has a Story, Savi Sharma

    // ---------- Myths & retellings ----------
    "7913305": ["myth", "india"],            // The Immortals of Meluha, Amish
    "40948565": ["myth", "india"],           // The Secret of the Nagas
    "12820793": ["myth", "india"],           // The Oath of the Vayuputras
    "24709327": ["myth", "india"],           // Scion of Ikshvaku
    "34680719": ["myth", "india"],           // Sita: Warrior of Mithila
    "35286872": ["myth", "india"],           // Raavan: Enemy of Aryavarta
    "13563459": ["myth", "india"],           // Asura, Neelakantan
    "42122936": ["myth", "india"],           // Vanara, Neelakantan
    "36318925": ["myth", "india"],           // Dharmayoddha Kalki, Missal
    "39858098": ["myth", "fantasy", "india"], // Son of Bhrigu, Doyle
    "9864913": ["myth", "india"],            // Jaya, Pattanaik (the Mahabharata)

    // ---------- History & geopolitics ----------
    "572918": ["history"],                   // Mastering Modern World History, Lowe
    "1229565": ["history"],                  // Mastering Twentieth Century Russian History
    "2711347": ["history"],                  // Mastering Modern British History
    "18145971": ["history"],                 // History of the World, Arjun Dev
    "2413423": ["history", "money"],         // A Splendid Exchange: how trade shaped the world
    "23692271": ["history", "science"],      // Sapiens, Harari
    "1842": ["history", "science"],          // Guns, Germs, and Steel, Diamond
    "25812847": ["history"],                 // The Silk Roads, Frankopan
    "840043": ["history", "money"],          // The Rise and Fall of the Great Powers, Kennedy
    "164581115": ["history", "war"],         // The Rise and Fall of the Third Reich, Shirer
    "21926865": ["history"],                 // The Accidental Superpower, Zeihan
    "87398": ["history"],                    // Soft Power, Nye
    "55160091": ["history", "india"],        // The Ultimate Goal, Vikram Sood (intelligence and narratives)
    "154126": ["history", "india"],          // The Discovery of India, Nehru
    "58865320": ["history", "india"],        // A Brief History of Modern India, Ahir
    "20656089": ["history", "india"],        // Indian Polity, Laxmikanth
    "11090612": ["history", "war", "india"], // Solstice at Panipat, Kulkarni

    // ---------- War & the military ----------
    "28496753": ["war", "history", "india"], // 1962: The War That Wasn't
    "6092335": ["war", "history", "india"],  // Himalayan Blunder, Dalvi
    "51734417": ["war", "india"],            // Watershed 1967
    "54966035": ["war", "india"],            // Full Spectrum: India's wars 1972-2020
    "46014467": ["war", "india"],            // Operation X: the naval war in Bangladesh
    "36149971": ["war", "india"],            // India's Most Fearless, Aroor and Rahul Singh
    "11887020": ["war", "lives"],            // American Sniper, Chris Kyle

    // ---------- Biography & memoir ----------
    "11084145": ["lives", "tech", "money"],  // Steve Jobs, Isaacson
    "122765395": ["lives", "tech", "money"], // Elon Musk, Isaacson
    "34684622": ["lives", "science"],        // Leonardo da Vinci, Isaacson
    "20821092": ["lives", "history", "war"], // Napoleon: A Life, Roberts
    "35133922": ["lives"],                   // Educated, Westover
    "29780253": ["lives"],                   // Born a Crime, Noah
    "1848": ["lives", "history"],            // Wild Swans, Jung Chang
    "49110169": ["lives", "history"],        // One Bright Moon, Kwong
    "8664353": ["lives", "war"],             // Unbroken, Hillenbrand
    "41721428": ["lives", "mind"],           // Can't Hurt Me, Goggins
    "22609522": ["lives", "money"],          // Red Notice, Browder
    "252577": ["lives"],                     // Angela's Ashes, McCourt
    "32085": ["lives"],                      // All Creatures Great and Small, Herriot
    "48855": ["lives", "history", "war"],    // The Diary of a Young Girl, Anne Frank
    "112803": ["lives", "history", "india"], // Gandhi: An Autobiography
    "20625812": ["lives", "history", "india"], // An Indian Pilgrim, Subhas Chandra Bose
    "11347342": ["lives", "history", "india"], // His Majesty's Opponent, Sugata Bose

    // ---------- Science & mathematics ----------
    "21": ["science"],                       // A Short History of Nearly Everything
    "17278": ["science"],                    // The Feynman Lectures on Physics, Vol. 1
    "34466963": ["science", "mind"],         // Why We Sleep, Walker
    "1991": ["science"],                     // Why Is Sex Fun?, Diamond
    "232560": ["science", "money"],          // Stochastic Calculus for Finance I, Shreve
    "232559": ["science", "money"],          // Stochastic Calculus for Finance II

    // ---------- Business, money & economics ----------
    "13356644": ["money", "science"],        // The Physics of Wall Street, Weatherall
    "43889703": ["money", "lives", "tech"],  // The Man Who Solved the Market (Jim Simons)
    "44525305": ["money", "lives"],          // The Ride of a Lifetime, Iger
    "54898389": ["money", "philosophy"],     // The Almanack of Naval Ravikant
    "52199304": ["money"],                   // The World for Sale, Blas (commodity traders)
    "87661": ["money"],                      // Globalization and Its Discontents, Stiglitz
    "296201": ["money", "history", "india"], // India Unbound, Gurcharan Das
    "17450636": ["money", "india"],          // Indian Economy, Ramesh Singh
    "29939161": ["money", "mind"],           // Radical Candor, Scott (management)

    // ---------- Mind, habits & productivity ----------
    "40121378": ["mind"],                    // Atomic Habits, Clear
    "17166225": ["mind"],                    // The Miracle Morning, Elrod
    "4865": ["mind"],                        // How to Win Friends and Influence People
    "81959": ["mind", "philosophy"],         // As a Man Thinketh, Allen
    "25744928": ["mind"],                    // Deep Work, Newport
    "1633": ["mind"],                        // Getting Things Done, Allen
    "54895700": ["mind"],                    // Effortless, McKeown
    "9420697": ["mind"],                     // The Compound Effect, Hardy
    "10713286": ["mind"],                    // Outwitting the Devil, Hill
    "151339300": ["mind"],                   // Emotional Intelligence Habits, Bradberry
    "66354": ["mind", "science"],            // Flow, Csikszentmihalyi
    "28815": ["mind", "money"],              // Influence, Cialdini

    // ---------- Philosophy & meaning ----------
    "30659": ["philosophy"],                 // Meditations, Marcus Aurelius
    "4069": ["philosophy", "lives"],         // Man's Search for Meaning, Frankl
    "96999": ["philosophy"],                 // Courage, Osho

    // ---------- Writing & poetry ----------
    "222900": ["craft"],                     // Writing About Your Life, Zinsser
    "585474": ["craft"],                     // Writing to Learn, Zinsser
    "23513349": ["craft"]                    // Milk and Honey, Rupi Kaur
  }
};
