// Fake data for different question types
export const generateFakeQuestions = () => {
  return [
    {
      id: 1,
      type: 'SECTION',
      title: 'The Concept of Nationality',
      passage: `Nationality is a legal relationship between an individual and a nation. It is the status of belonging to a particular nation, whether by birth or naturalization. This relationship grants certain rights and responsibilities to the individual within that nation's territory.

The concept of nationality has evolved over time and varies significantly between different countries and legal systems. In some countries, nationality is determined by the place of birth (jus soli), while in others, it is determined by the nationality of one's parents (jus sanguinis). Some countries use a combination of both principles.

Nationality provides individuals with various rights, including the right to vote, the right to work without restrictions, the right to access public services, and the right to protection by their government when traveling abroad. It also comes with responsibilities such as paying taxes, obeying laws, and potentially serving in the military.

The process of acquiring nationality can happen through birth, descent, naturalization, or other legal means depending on the country's laws. Some individuals may hold multiple nationalities, while others may be stateless if they don't possess the nationality of any country.

In the modern world, nationality plays a crucial role in determining an individual's identity, legal status, and relationship with the state. It affects everything from travel documents to educational opportunities and employment prospects.

Throughout history, the concept of nationality has been shaped by various factors including wars, migrations, colonial periods, and political changes. The formation of nation-states in Europe during the 19th century marked a significant turning point in how nationality was understood and implemented. Before this period, people's identities were often tied to their local communities, religious affiliations, or feudal relationships rather than to a specific nation.

The French Revolution played a particularly important role in developing modern concepts of citizenship and nationality. The revolutionary government introduced the idea that all citizens were equal before the law, regardless of their social status or birth. This principle influenced many other countries and helped establish the foundation for modern nationality laws.

In the 20th century, two world wars and numerous conflicts led to massive population movements and changes in national boundaries. These events forced many countries to reconsider their nationality laws and policies. The Holocaust, in particular, highlighted the dangers of statelessness and led to international efforts to protect refugees and stateless persons.

Today, globalization has created new challenges for nationality laws. Increased international travel, migration, and the rise of multinational corporations have made it more common for people to have connections to multiple countries. Some countries have responded by allowing dual or multiple citizenship, while others maintain stricter policies.

The digital age has also introduced new considerations for nationality. Online communities, virtual citizenship programs, and digital nomad visas are challenging traditional concepts of territorial-based nationality. Some countries are experimenting with digital citizenship programs that allow people to participate in governance and access services without physically residing in the country.

Climate change is another factor that may influence nationality laws in the future. As sea levels rise and extreme weather events become more frequent, some island nations may face existential threats. This could lead to new forms of nationality or citizenship arrangements for displaced populations.

International organizations like the United Nations have developed various conventions and protocols to address issues related to nationality, statelessness, and refugee protection. These international frameworks help ensure that nationality laws respect human rights and provide protection for vulnerable populations.

The future of nationality will likely continue to evolve as societies adapt to new challenges and opportunities. Technological advances, environmental changes, and shifting political landscapes will all play a role in shaping how we understand and implement nationality in the years to come.`,
      questions: [
        {
          id: 1,
          type: 'MULTIPLE_CHOICE',
          question: 'What is nationality?',
          options: [
            { key: 'A', text: 'A historical event', isCorrect: false },
            { key: 'B', text: 'A legal relationship between an individual and a nation', isCorrect: true },
            { key: 'C', text: 'A cultural tradition', isCorrect: false },
            { key: 'D', text: 'A type of government', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 2,
          type: 'MULTIPLE_SELECT',
          question: 'Which of the following are ways to acquire nationality? (Select all that apply)',
          options: [
            { key: 'A', text: 'Birth', isCorrect: true },
            { key: 'B', text: 'Descent', isCorrect: true },
            { key: 'C', text: 'Naturalization', isCorrect: true },
            { key: 'D', text: 'Marriage only', isCorrect: false },
          ],
          points: 2
        },
        {
          id: 3,
          type: 'TRUE_OR_FALSE',
          question: 'The French Revolution played a particularly important role in developing modern concepts of citizenship and nationality.',
          options: [
            { key: 'True', text: 'True', isCorrect: true },
            { key: 'False', text: 'False', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 4,
          type: 'FILL_IN_THE_BLANK',
          questionText: 'Nationality is a legal relationship between an individual and a _______.',
          content: {
            data: [
              { id: 1, value: 'nation', positionId: 'pos_1', correct: true }
            ]
          },
          points: 2
        },
        {
          id: 5,
          type: 'DROPDOWN',
          questionText: 'Complete the sentence: Nationality can be acquired through _______ or naturalization.',
          content: {
            data: [
              { id: 1, value: 'birth', positionId: 'pos_1', correct: true },
              { id: 2, value: 'death', positionId: 'pos_1', correct: false },
              { id: 3, value: 'marriage', positionId: 'pos_1', correct: false },
              { id: 4, value: 'travel', positionId: 'pos_1', correct: false },
            ]
          },
          points: 2
        },
        {
          id: 6,
          type: 'DRAG_AND_DROP',
          questionText: 'Complete the sentence: I _______ programming and _______ it very much.',
          content: {
            data: [
              { id: 1, value: 'love', positionId: 'pos_1', correct: true },
              { id: 2, value: 'enjoy', positionId: 'pos_2', correct: true },
              { id: 3, value: 'like', correct: false },
              { id: 4, value: 'hate', correct: false },
            ]
          },
          points: 3
        },
        {
          id: 7,
          type: 'REARRANGE',
          questionText: 'Rearrange the words to form a correct sentence:',
          content: {
            data: [
              { id: 1, value: 'The', positionId: 'pos_1' },
              { id: 2, value: 'flower', positionId: 'pos_2' },
              { id: 3, value: 'is', positionId: 'pos_3' },
              { id: 4, value: 'very', positionId: 'pos_4' },
              { id: 5, value: 'much', positionId: 'pos_5' },
            ]
          },
          points: 3
        }
      ],
      points: 11,
      questionText: 'Read the passage and answer the questions',
    },
    {
      id: 2,
      type: 'LISTENING_SECTION',
      title: 'Climate Change and Environmental Protection',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder audio URL
      duration: '2:45',
      transcript: `Climate change is one of the most pressing issues of our time. It refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, human activities have been the main driver of climate change since the 1800s, primarily due to burning fossil fuels like coal, oil, and gas.

The greenhouse effect is a natural process that warms the Earth's surface. When the Sun's energy reaches the Earth's atmosphere, some of it is reflected back to space, and the rest is absorbed and re-radiated by greenhouse gases. These gases include water vapor, carbon dioxide, methane, nitrous oxide, and ozone. However, human activities have increased the concentration of these gases in the atmosphere, particularly carbon dioxide, which has increased by about 50% since the Industrial Revolution.

The consequences of climate change are already visible and will become more severe over time. Rising global temperatures lead to more frequent and intense heatwaves, droughts, and wildfires. Melting glaciers and ice sheets contribute to rising sea levels, threatening coastal communities worldwide. Changes in precipitation patterns affect agriculture and water supplies, while ocean acidification threatens marine ecosystems.

To address climate change, countries around the world have committed to reducing greenhouse gas emissions. The Paris Agreement, adopted in 2015, aims to limit global temperature rise to well below 2 degrees Celsius above pre-industrial levels, with efforts to limit it to 1.5 degrees. This requires transitioning to renewable energy sources, improving energy efficiency, and implementing sustainable practices across all sectors.

Individual actions also matter in the fight against climate change. People can reduce their carbon footprint by using public transportation, cycling, or walking instead of driving. Energy conservation at home, such as using LED light bulbs and improving insulation, can significantly reduce energy consumption. Choosing sustainable products and reducing waste through recycling and composting are other ways individuals can contribute.

The transition to a sustainable future requires innovation, investment, and international cooperation. Renewable energy technologies like solar and wind power are becoming increasingly cost-effective and widespread. Electric vehicles are gaining popularity as battery technology improves. Green building practices and sustainable agriculture methods are being adopted worldwide.

Education and awareness are crucial for addressing climate change. Understanding the science behind climate change helps people make informed decisions about their lifestyle choices and support policies that promote environmental protection. Young people, in particular, are playing an important role in climate activism, demanding action from governments and corporations.

The future of our planet depends on the actions we take today. While the challenges are significant, there is still hope if we act decisively and collectively. By working together, we can create a more sustainable world for future generations.`,
      questions: [
        {
          id: 8,
          type: 'MULTIPLE_CHOICE',
          question: 'What is the main cause of climate change since the 1800s?',
          options: [
            { key: 'A', text: 'Natural climate variations', isCorrect: false },
            { key: 'B', text: 'Human activities, particularly burning fossil fuels', isCorrect: true },
            { key: 'C', text: 'Solar radiation changes', isCorrect: false },
            { key: 'D', text: 'Volcanic eruptions', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 9,
          type: 'MULTIPLE_SELECT',
          question: 'Which of the following are consequences of climate change? (Select all that apply)',
          options: [
            { key: 'A', text: 'Rising sea levels', isCorrect: true },
            { key: 'B', text: 'More frequent heatwaves', isCorrect: true },
            { key: 'C', text: 'Ocean acidification', isCorrect: true },
            { key: 'D', text: 'Decreased global temperatures', isCorrect: false },
          ],
          points: 2
        },
        {
          id: 10,
          type: 'TRUE_OR_FALSE',
          question: 'The Paris Agreement aims to limit global temperature rise to well below 2 degrees Celsius.',
          options: [
            { key: 'True', text: 'True', isCorrect: true },
            { key: 'False', text: 'False', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 11,
          type: 'FILL_IN_THE_BLANK',
          questionText: 'The greenhouse effect is a _______ process that warms the Earth\'s surface.',
          content: {
            data: [
              { id: 1, value: 'natural', positionId: 'pos_1', correct: true }
            ]
          },
          points: 2
        }
      ],
      points: 6,
      questionText: 'Listen to the audio and answer the questions',
    },
    {
      id: 3,
      type: 'SPEAKING_SECTION',
      title: 'Describe Your Hometown',
      prompt: `Please describe your hometown in English. Your response should include:

**Requirements:**
- Minimum 60 seconds
- Speak clearly and at a moderate pace
- Use proper pronunciation
- Cover the following topics: location, notable places, and what you like about it

**Topic Focus:**
Discuss:
1. Location and basic information about your hometown
2. Notable places or landmarks
3. What you like most about your hometown
4. Any interesting facts or personal experiences

**Tips for Success:**
- Plan your answer before recording
- Use transition words (first, secondly, finally, etc.)
- Speak naturally and confidently
- Make sure to speak for at least 60 seconds

**Time Limit:** 3 minutes to record

Good luck with your speaking!`,
      timeLimit: 60,
      points: 15,
      questionText: 'Record your speaking response',
    },
    {
      id: 4,
      type: 'SPEAKING_WITH_AUDIO_SECTION',
      title: 'Speaking Based on Audio',
      audioUrl: '/audio/sample-speaking-audio.mp3',
      transcript: `Phiên âm tiếng Anh của "quả chuối" (banana) là /bəˈnɑːnə/. Từ này có trọng âm rơi vào âm tiết thứ hai.

**Từ vựng:** Banana
**Phiên âm:** /bəˈnɑːnə/
**Trọng âm:** Nhấn vào âm tiết thứ hai

![Banana](/img/banana.jpg)`,
      timeLimit: 180,
      points: 20,
      questionText: 'Listen to the audio and answer the questions',
    },
    {
      id: 5,
      type: 'WRITING_SECTION',
      title: 'Environmental Conservation Essay',
      prompt: `Write an essay about environmental conservation. Your essay should include:

**Requirements:**
- Minimum 300 words
- Use proper essay structure (introduction, body paragraphs, conclusion)
- Include specific examples of environmental issues
- Suggest practical solutions
- Use formal academic language

**Topic Focus:**
Choose one of the following environmental issues to focus on:
1. Climate change and its global impact
2. Deforestation and loss of biodiversity
3. Water pollution and scarcity
4. Renewable energy solutions
5. Sustainable living practices

**Evaluation Criteria:**
- Content and ideas (40%)
- Organization and structure (25%)
- Language use and vocabulary (20%)
- Grammar and mechanics (15%)

**Tips for Success:**
- Plan your essay before writing
- Use clear topic sentences for each paragraph
- Support your arguments with evidence
- Proofread your work before submitting
- Stay within the word limit

**Time Limit:** 60 minutes

Good luck with your writing!`,
      wordLimit: 300,
      timeLimit: 60,
      points: 25,
      questionText: 'Write an essay based on the given prompt',
    },
    {
      id: 2,
      type: 'MULTIPLE_CHOICE',
      question: 'What is the capital city of Vietnam?',
      options: [
        { key: 'A', text: 'Ho Chi Minh City', isCorrect: false },
        { key: 'B', text: 'Hanoi', isCorrect: true },
        { key: 'C', text: 'Da Nang', isCorrect: false },
        { key: 'D', text: 'Can Tho', isCorrect: false },
      ],
      points: 1,
      questionText: 'What is the capital city of Vietnam?',
    },
    {
      id: 2,
      type: 'MULTIPLE_SELECT',
      question: 'Which of the following are Southeast Asian countries? (Select all that apply)',
      options: [
        { key: 'A', text: 'Vietnam', isCorrect: true },
        { key: 'B', text: 'Thailand', isCorrect: true },
        { key: 'C', text: 'Japan', isCorrect: false },
        { key: 'D', text: 'Malaysia', isCorrect: true },
      ],
      points: 2,
      questionText: 'Which of the following are Southeast Asian countries? (Select all that apply)',
    },
    {
      id: 3,
      type: 'TRUE_OR_FALSE',
      question: 'The Earth revolves around the Sun.',
      options: [
        { key: 'True', text: 'True', isCorrect: true },
        { key: 'False', text: 'False', isCorrect: false },
      ],
      points: 1,
      questionText: 'The Earth revolves around the Sun.',
    },
    {
      id: 4,
      type: 'FILL_IN_THE_BLANK',
      questionText: 'The largest planet in our solar system is _______.',
      content: {
        data: [
          { id: 1, value: 'Jupiter', positionId: 'pos_1', correct: true }
        ]
      },
      points: 2,
    },
    {
      id: 5,
      type: 'DROPDOWN',
      questionText: 'Paris is the capital city of [[pos_1]].',
      content: {
        data: [
          { id: 1, value: 'France', positionId: 'pos_1', correct: true },
          { id: 2, value: 'Germany', positionId: 'pos_1', correct: false },
          { id: 3, value: 'Italy', positionId: 'pos_1', correct: false },
        ]
      },
      points: 2,
    },
    {
      id: 6,
      type: 'DRAG_AND_DROP',
      questionText: 'Arrange the words to form a correct sentence: [[pos_1]] [[pos_2]] [[pos_3]].',
      content: {
        data: [
          { id: 1, value: 'I', positionId: 'pos_1', correct: true },
          { id: 2, value: 'love', positionId: 'pos_2', correct: true },
          { id: 3, value: 'programming', positionId: 'pos_3', correct: true },
          { id: 4, value: 'hate', correct: false },
          { id: 5, value: 'coding', correct: false },
        ]
      },
      points: 3,
    },
    {
      id: 7,
      type: 'REARRANGE',
      questionText: 'Rearrange to form a correct sentence: [[pos_1]] [[pos_2]] [[pos_3]] [[pos_4]] beautiful.',
      content: {
        data: [
          { id: 1, value: 'The', positionId: 'pos_1' },
          { id: 2, value: 'flower', positionId: 'pos_2' },
          { id: 3, value: 'is', positionId: 'pos_3' },
          { id: 4, value: 'very', positionId: 'pos_4' },
        ]
      },
      points: 3,
    },
    {
      id: 8,
      type: 'REWRITE',
      questionText: 'Rewrite the sentence in passive voice: The teacher explains the lesson.',
      content: {
        data: [
          { id: 1, value: 'The lesson is explained by the teacher.' }
        ]
      },
      points: 5,
    },
    {
      id: 9,
      type: 'MULTIPLE_CHOICE',
      question: 'Which programming language is used for web development?',
      options: [
        { key: 'A', text: 'JavaScript', isCorrect: true },
        { key: 'B', text: 'Assembly', isCorrect: false },
        { key: 'C', text: 'Machine Code', isCorrect: false },
        { key: 'D', text: 'Binary', isCorrect: false },
      ],
      points: 1,
      questionText: 'Which programming language is used for web development?',
    },
    {
      id: 10,
      type: 'TRUE_OR_FALSE',
      question: 'React is a JavaScript library for building user interfaces.',
      options: [
        { key: 'True', text: 'True', isCorrect: true },
        { key: 'False', text: 'False', isCorrect: false },
      ],
      points: 1,
      questionText: 'React is a JavaScript library for building user interfaces.',
    },
  ];
};

export const generateFakeDataByType = (challengeType) => {
  const questions = [];
  const readingSections = [];
  const listeningSections = [];
  const writingSections = [];
  const speakingSections = [];

  if (challengeType === 'GV') {
    // Grammar & Vocabulary - individual questions
    questions.push(
      {
        id: 'gv-1',
        type: 'MULTIPLE_CHOICE',
        questionText: 'Choose the correct word to complete the sentence: "I have _____ finished my homework."',
        question: 'Choose the correct word to complete the sentence: "I have _____ finished my homework."',
        options: [
          { key: 'A', text: 'already', isCorrect: true },
          { key: 'B', text: 'yet', isCorrect: false },
          { key: 'C', text: 'still', isCorrect: false },
          { key: 'D', text: 'just', isCorrect: false },
        ],
        points: 1,
        orderNumber: 1,
        feedback: 'Great job! You correctly identified "already" as the right answer. "Already" is used to indicate that something happened before now or earlier than expected. Keep up the excellent work!',
      },
      {
        id: 'gv-1b',
        type: 'MULTIPLE_CHOICE',
        questionText: 'What is the past tense of "go"?',
        question: 'What is the past tense of "go"?',
        options: [
          { key: 'A', text: 'went', isCorrect: true },
          { key: 'B', text: 'goed', isCorrect: false },
          { key: 'C', text: 'goes', isCorrect: false },
          { key: 'D', text: 'gone', isCorrect: false },
        ],
        points: 1,
        orderNumber: 2,
      },
      {
        id: 'gv-2',
        type: 'MULTIPLE_SELECT',
        questionText: 'Select all the synonyms of "beautiful":',
        question: 'Select all the synonyms of "beautiful":',
        options: [
          { key: 'A', text: 'pretty', isCorrect: true },
          { key: 'B', text: 'ugly', isCorrect: false },
          { key: 'C', text: 'gorgeous', isCorrect: true },
          { key: 'D', text: 'lovely', isCorrect: true },
        ],
        points: 2,
        orderNumber: 3,
        feedback: 'Well done! You correctly selected all the synonyms of "beautiful": pretty, gorgeous, and lovely. Remember that synonyms are words with similar meanings. "Ugly" is an antonym (opposite meaning), not a synonym.',
      },
      {
        id: 'gv-2b',
        type: 'MULTIPLE_SELECT',
        questionText: 'Which of the following are colors? (Select all that apply)',
        question: 'Which of the following are colors? (Select all that apply)',
        options: [
          { key: 'A', text: 'red', isCorrect: true },
          { key: 'B', text: 'blue', isCorrect: true },
          { key: 'C', text: 'table', isCorrect: false },
          { key: 'D', text: 'yellow', isCorrect: true },
        ],
        points: 2,
        orderNumber: 4,
      },
      {
        id: 'gv-3',
        type: 'TRUE_OR_FALSE',
        questionText: 'The word "quickly" is an adjective.',
        question: 'The word "quickly" is an adjective.',
        options: [
          { key: 'A', text: 'True', isCorrect: false },
          { key: 'B', text: 'False', isCorrect: true },
        ],
        points: 1,
        orderNumber: 5,
      },
      {
        id: 'gv-3b',
        type: 'TRUE_OR_FALSE',
        questionText: 'Paris is the capital of France.',
        question: 'Paris is the capital of France.',
        options: [
          { key: 'A', text: 'True', isCorrect: true },
          { key: 'B', text: 'False', isCorrect: false },
        ],
        points: 1,
        orderNumber: 6,
      },
      {
        id: 'gv-4',
        type: 'FILL_IN_THE_BLANK',
        questionText: 'Complete the sentence: "She [[pos_1]] to the store yesterday."',
        question: 'Complete the sentence: "She _____ to the store yesterday."',
        content: {
          data: [
            { id: 1, value: 'went', positionId: 'pos_1', correct: true }
          ]
        },
        points: 2,
        orderNumber: 7,
      },
      {
        id: 'gv-4b',
        type: 'FILL_IN_THE_BLANK',
        questionText: 'Fill in the blank: "The weather is very [[pos_1]] today."',
        question: 'Fill in the blank: "The weather is very _____ today."',
        content: {
          data: [
            { id: 1, value: 'beautiful', positionId: 'pos_1', correct: true }
          ]
        },
        points: 2,
        orderNumber: 8,
      },
      {
        id: 'gv-5',
        type: 'DROPDOWN',
        questionText: 'Choose the correct word: "I like to read books [[pos_1]] my free time."',
        question: 'Choose the correct word: "I like to read books _____ my free time."',
        content: {
          data: [
            { id: 1, value: 'in', positionId: 'pos_1', correct: true },
            { id: 2, value: 'on', positionId: 'pos_1', correct: false },
            { id: 3, value: 'at', positionId: 'pos_1', correct: false },
            { id: 4, value: 'by', positionId: 'pos_1', correct: false },
          ]
        },
        points: 2,
        orderNumber: 9,
      },
      {
        id: 'gv-5b',
        type: 'DROPDOWN',
        questionText: 'Select the correct preposition: "She arrived [[pos_1]] the airport at 9 AM."',
        question: 'Select the correct preposition: "She arrived _____ the airport at 9 AM."',
        content: {
          data: [
            { id: 1, value: 'at', positionId: 'pos_1', correct: true },
            { id: 2, value: 'in', positionId: 'pos_1', correct: false },
            { id: 3, value: 'on', positionId: 'pos_1', correct: false },
            { id: 4, value: 'to', positionId: 'pos_1', correct: false },
          ]
        },
        points: 2,
        orderNumber: 10,
      },
      {
        id: 'gv-6',
        type: 'DRAG_AND_DROP',
        questionText: 'Complete the sentence: I [[pos_1]] programming and [[pos_2]] it very much.',
        question: 'Complete the sentence: I _____ programming and _____ it very much.',
        content: {
          data: [
            { id: 1, value: 'love', positionId: 'pos_1', correct: true },
            { id: 2, value: 'enjoy', positionId: 'pos_2', correct: true },
            { id: 3, value: 'like', correct: false },
            { id: 4, value: 'hate', correct: false },
            { id: 5, value: 'dislike', correct: false },
          ]
        },
        points: 3,
        orderNumber: 11,
      },
      {
        id: 'gv-6b',
        type: 'DRAG_AND_DROP',
        questionText: 'Fill in the blanks: She [[pos_1]] to music and [[pos_2]] dancing.',
        question: 'Fill in the blanks: She _____ to music and _____ dancing.',
        content: {
          data: [
            { id: 1, value: 'listens', positionId: 'pos_1', correct: true },
            { id: 2, value: 'loves', positionId: 'pos_2', correct: true },
            { id: 3, value: 'hears', correct: false },
            { id: 4, value: 'hates', correct: false },
            { id: 5, value: 'enjoys', correct: false },
          ]
        },
        points: 3,
        orderNumber: 12,
      },
      {
        id: 'gv-7',
        type: 'REARRANGE',
        questionText: 'Rearrange the words to form a correct sentence: [[pos_1]] [[pos_2]] [[pos_3]] quickly.',
        question: 'Rearrange the words to form a correct sentence.',
        content: {
          data: [
            { id: 1, value: 'He', positionId: 'pos_1' },
            { id: 2, value: 'runs', positionId: 'pos_2' },
            { id: 3, value: 'very', positionId: 'pos_3' },
          ]
        },
        points: 2,
        orderNumber: 13,
      },
      {
        id: 'gv-7b',
        type: 'REARRANGE',
        questionText: 'Arrange the words correctly: [[pos_1]] [[pos_2]] [[pos_3]] beautiful.',
        question: 'Arrange the words correctly.',
        content: {
          data: [
            { id: 1, value: 'The', positionId: 'pos_1' },
            { id: 2, value: 'flower', positionId: 'pos_2' },
            { id: 3, value: 'is', positionId: 'pos_3' },
          ]
        },
        points: 2,
        orderNumber: 14,
      },
      {
        id: 'gv-8',
        type: 'REWRITE',
        questionText: 'Rewrite the sentence in passive voice: "The teacher explains the lesson."',
        question: 'Rewrite the sentence in passive voice: "The teacher explains the lesson."',
        content: {
          data: [
            { id: 1, value: 'The lesson is explained by the teacher.' }
          ]
        },
        points: 5,
        orderNumber: 11,
      },
      {
        id: 'gv-8b',
        type: 'REWRITE',
        questionText: 'Rewrite the sentence using reported speech: "I will finish my homework," she said.',
        question: 'Rewrite the sentence using reported speech: "I will finish my homework," she said.',
        content: {
          data: [
            { id: 1, value: 'She said that she would finish her homework.' }
          ]
        },
        points: 5,
        orderNumber: 12,
      },
      {
        id: 'gv-blank-mc',
        type: 'MULTIPLE_CHOICE',
        questionText: 'Which sentence is grammatically correct?',
        question: 'Which sentence is grammatically correct?',
        options: [
          { key: 'A', text: 'She don\'t like coffee.', isCorrect: false },
          { key: 'B', text: 'She doesn\'t like coffee.', isCorrect: true },
          { key: 'C', text: 'She not like coffee.', isCorrect: false },
          { key: 'D', text: 'She doesn\'t likes coffee.', isCorrect: false },
        ],
        points: 1,
        orderNumber: 13,
      }
    );
  } else if (challengeType === 'RE') {
    readingSections.push({
      id: 'reading-1',
      type: 'SECTION',
      title: 'The Benefits of Reading',
      passage: `Reading is one of the most important skills we can develop. It opens up new worlds and ideas, improves our vocabulary, and enhances our ability to think critically. When we read regularly, we expose ourselves to different perspectives and cultures, which helps us become more empathetic and understanding individuals.

Reading also improves our writing skills. By seeing how other authors structure their sentences and paragraphs, we learn to express our own ideas more clearly and effectively. Additionally, reading reduces stress and helps us relax, making it an excellent way to unwind after a long day.

Studies have shown that people who read regularly have better memory and cognitive function. Reading exercises our brain, keeping it active and healthy. It's like going to the gym, but for your mind.

Whether you prefer fiction or non-fiction, novels or articles, the important thing is to make reading a regular part of your life. Start with just a few minutes each day, and gradually increase the time as you develop the habit.`,
      questions: [
        {
          id: 're-1',
          type: 'MULTIPLE_CHOICE',
          questionText: 'According to the passage, reading helps us become more:',
          question: 'According to the passage, reading helps us become more:',
          options: [
            { key: 'A', text: 'intelligent', isCorrect: false },
            { key: 'B', text: 'empathetic', isCorrect: true },
            { key: 'C', text: 'competitive', isCorrect: false },
            { key: 'D', text: 'wealthy', isCorrect: false },
          ],
          points: 1,
          orderNumber: 1,
        },
        {
          id: 're-2',
          type: 'MULTIPLE_SELECT',
          questionText: 'According to the passage, which of the following are benefits of reading? (Select all that apply)',
          question: 'According to the passage, which of the following are benefits of reading? (Select all that apply)',
          options: [
            { key: 'A', text: 'Improves vocabulary', isCorrect: true },
            { key: 'B', text: 'Reduces stress', isCorrect: true },
            { key: 'C', text: 'Improves memory', isCorrect: true },
            { key: 'D', text: 'Increases wealth', isCorrect: false },
          ],
          points: 2,
          orderNumber: 2,
        },
        {
          id: 're-3',
          type: 'TRUE_OR_FALSE',
          questionText: 'The passage states that reading only improves vocabulary.',
          question: 'The passage states that reading only improves vocabulary.',
          options: [
            { key: 'A', text: 'True', isCorrect: false },
            { key: 'B', text: 'False', isCorrect: true },
          ],
          points: 1,
          orderNumber: 3,
        },
        {
          id: 're-4',
          type: 'FILL_IN_THE_BLANK',
          questionText: 'Complete the sentence based on the passage: "Reading exercises our [[pos_1]], keeping it [[pos_2]] and healthy."',
          question: 'Complete the sentence based on the passage: "Reading exercises our _____, keeping it _____ and healthy."',
          content: {
            data: [
              { id: 1, value: 'brain', positionId: 'pos_1', correct: true },
              { id: 2, value: 'active', positionId: 'pos_2', correct: true }
            ]
          },
          points: 2,
          orderNumber: 4,
        },
        {
          id: 're-5',
          type: 'DROPDOWN',
          questionText: 'Based on the passage: "Reading is like going to the [[pos_1]], but for your [[pos_2]]."',
          question: 'Based on the passage: "Reading is like going to the _____, but for your _____."',
          content: {
            data: [
              { id: 1, value: 'gym', positionId: 'pos_1', correct: true },
              { id: 2, value: 'park', positionId: 'pos_1', correct: false },
              { id: 3, value: 'library', positionId: 'pos_1', correct: false },
              { id: 4, value: 'mind', positionId: 'pos_2', correct: true },
              { id: 5, value: 'body', positionId: 'pos_2', correct: false },
              { id: 6, value: 'health', positionId: 'pos_2', correct: false },
            ]
          },
          points: 2,
          orderNumber: 5,
        },
        {
          id: 're-6',
          type: 'DRAG_AND_DROP',
          questionText: 'Complete the sentence: Reading [[pos_1]] us to different [[pos_2]] and cultures.',
          question: 'Complete the sentence: Reading _____ us to different _____ and cultures.',
          content: {
            data: [
              { id: 1, value: 'exposes', positionId: 'pos_1', correct: true },
              { id: 2, value: 'perspectives', positionId: 'pos_2', correct: true },
              { id: 3, value: 'introduces', correct: false },
              { id: 4, value: 'shows', correct: false },
              { id: 5, value: 'ideas', correct: false },
            ]
          },
          points: 3,
          orderNumber: 6,
        },
        {
          id: 're-7',
          type: 'REARRANGE',
          questionText: 'Rearrange the words to form a sentence from the passage: [[pos_1]] [[pos_2]] [[pos_3]] [[pos_4]] to make reading a regular part of your life.',
          question: 'Rearrange the words to form a sentence from the passage.',
          content: {
            data: [
              { id: 1, value: 'The', positionId: 'pos_1' },
              { id: 2, value: 'important', positionId: 'pos_2' },
              { id: 3, value: 'thing', positionId: 'pos_3' },
              { id: 4, value: 'is', positionId: 'pos_4' },
            ]
          },
          points: 2,
          orderNumber: 7,
        },
      ],
      points: 13,
      feedback: 'Excellent work on this reading section! You demonstrated a good understanding of the main ideas and details from the passage. Your comprehension of the text about reading benefits shows strong analytical skills. Continue practicing reading comprehension exercises to further improve your speed and accuracy. Well done!',
    });
  } else if (challengeType === 'LI') {
    listeningSections.push({
      id: 'listening-1',
      type: 'LISTENING_SECTION',
      title: 'A Day at the Beach',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: '3:45',
      transcript: `Speaker: Welcome to today's listening practice. We're going to talk about planning a perfect day at the beach.

First, you should check the weather forecast. You don't want to go to the beach on a rainy day. Once you know the weather will be nice, pack your essentials. Bring sunscreen, a hat, sunglasses, towels, and plenty of water.

When you arrive at the beach, find a good spot. It's best to set up near the water but not too close, as the tide might come in. Make sure you have some shade available, especially if you're planning to stay for several hours.

Remember to apply sunscreen every two hours and drink water regularly to stay hydrated. Most importantly, have fun and enjoy your day at the beach!`,
      questions: [
        {
          id: 'li-1',
          type: 'MULTIPLE_CHOICE',
          questionText: 'What should you check before going to the beach?',
          question: 'What should you check before going to the beach?',
          options: [
            { key: 'A', text: 'The traffic', isCorrect: false },
            { key: 'B', text: 'The weather forecast', isCorrect: true },
            { key: 'C', text: 'The prices', isCorrect: false },
            { key: 'D', text: 'The time', isCorrect: false },
          ],
          points: 1,
          orderNumber: 1,
        },
        {
          id: 'li-2',
          type: 'MULTIPLE_CHOICE',
          questionText: 'How often should you apply sunscreen?',
          question: 'How often should you apply sunscreen?',
          options: [
            { key: 'A', text: 'Every hour', isCorrect: false },
            { key: 'B', text: 'Every two hours', isCorrect: true },
            { key: 'C', text: 'Once in the morning', isCorrect: false },
            { key: 'D', text: 'Only when needed', isCorrect: false },
          ],
          points: 1,
          orderNumber: 2,
        },
      ],
      points: 2,
      feedback: 'Good listening comprehension! You correctly identified the key information from the audio about planning a beach day. Your ability to extract details like checking the weather forecast and applying sunscreen every two hours shows attentive listening skills. Keep practicing listening exercises to improve your ability to catch specific details and main ideas. Great job!',
    });
  } else if (challengeType === 'WR') {
    writingSections.push({
      id: 'writing-1',
      type: 'WRITING_SECTION',
      title: 'Essay Writing',
      prompt: `Write an essay of at least 250 words about the importance of learning English in today's world. Your essay should include:

1. An introduction explaining why English is important
2. At least two main reasons supporting your viewpoint
3. Examples to illustrate your points
4. A conclusion summarizing your main ideas

Make sure to use proper grammar, vocabulary, and sentence structure.`,
      wordLimit: 250,
      timeLimit: 60,
      points: 10,
      questionText: 'Write an essay based on the given prompt',
      // Feedback with text ranges (startIndex and endIndex are character positions in the essay text)
      feedbacks: [
        {
          startIndex: 0,
          endIndex: 25,
          comment: 'Good introduction! Consider adding more context about the global significance of English.',
          author: 'Nguyen Duc Anh',
          timestamp: '21:04 Today'
        },
        {
          startIndex: 45,
          endIndex: 85,
          comment: 'Excellent point! This example clearly illustrates your argument.',
          author: 'Nguyen Duc Anh',
          timestamp: '21:04 Today'
        },
        {
          startIndex: 120,
          endIndex: 150,
          comment: 'Try to use more varied vocabulary here. Consider alternatives like "significant", "crucial", or "essential".',
          author: 'Nguyen Duc Anh',
          timestamp: '21:04 Today'
        }
      ]
    });
    
    // Add second writing section for file upload only
    writingSections.push({
      id: 'writing-2',
      type: 'WRITING_SECTION',
      title: 'Handwritten Essay Upload',
      prompt: `Upload images of your handwritten essay. Please make sure:
      
1. The images are clear and readable
2. All pages are included
3. The essay is at least 200 words
4. Images are in JPG or PNG format
5. Maximum 5 images (or 10MB total)

You can write your essay on paper and then take photos or scan it to upload.`,
      wordLimit: 200,
      timeLimit: 60,
      points: 10,
      questionText: 'Upload your handwritten essay',
    });
  } else if (challengeType === 'SP') {
    speakingSections.push({
      id: 'speaking-1',
      type: 'SPEAKING_SECTION',
      title: 'Describe Your Hometown',
      prompt: `Describe your hometown. You should talk about:
- Where it is located
- What it is famous for
- What you like and dislike about it
- Any changes you would like to see

You have 2 minutes to prepare and 3 minutes to speak.`,
      points: 10,
      audioUrl: null,
      feedback: 'Great speaking performance! Your description of your hometown was clear and well-structured. You effectively covered all the required points including location, notable features, personal opinions, and suggestions for improvement. Your pronunciation was generally good, though working on some difficult sounds would enhance clarity further. Continue practicing to improve fluency and expand your vocabulary. Excellent effort!',
    });
    speakingSections.push({
      id: 'speaking-2',
      type: 'SPEAKING_WITH_AUDIO_SECTION',
      title: 'Respond to Audio Prompt',
      prompt: 'Listen to the audio and respond to the questions asked.',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      transcript: 'Speaker: Can you tell me about your favorite hobby? What do you like about it? How long have you been doing it?',
      points: 10,
      feedback: 'Well done responding to the audio prompt! You demonstrated good listening comprehension and answered the questions appropriately. Your response showed understanding of the prompt and you provided relevant details about your hobby. Your speaking flow was natural and you maintained good eye contact (if applicable). To improve further, try to use more varied vocabulary and complex sentence structures. Keep up the good work!',
    });
  }

  return {
    questions,
    readingSections,
    listeningSections,
    writingSections,
    speakingSections,
  };
};

