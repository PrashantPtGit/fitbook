// Indian diet plan templates for Himachal Pradesh gym members
// Keys: {goal}_{dietType} — goal: weight_loss | muscle_gain | maintain
//                         — dietType: veg | veg_egg | nonveg

export const DIET_TEMPLATES = {

  // ─── WEIGHT LOSS ─────────────────────────────────────────────────────────────

  weight_loss_veg: {
    goal: 'Weight Loss', calories: 1600, protein: 75, carbs: 180, fat: 45,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 30,  items: ['1 glass warm water with lemon and jeera', '5 soaked almonds'] },
      { time: 'Breakfast (8 AM)',      calories: 280, items: ['2 moong dal chilla', '1 small bowl low-fat dahi', 'green chutney', '1 glass nimbu paani (no sugar)'] },
      { time: 'Mid Morning (11 AM)',   calories: 120, items: ['1 seasonal fruit (apple/pear/amrood)', '1 glass buttermilk (chaas) without salt'] },
      { time: 'Lunch (1 PM)',          calories: 420, items: ['2 phulka roti (no ghee)', '1 bowl dal (arhar/moong)', '1 sabzi (gobi/beans/lauki)', 'cucumber-tomato salad', '1 small bowl curd'] },
      { time: 'Evening Snack (4 PM)',  calories: 90,  items: ['1 banana or 1 bowl makhana (roasted, no ghee)', 'black coffee or green tea (no sugar)'] },
      { time: 'Pre Workout (5 PM)',    calories: 60,  items: ['1 small apple', '5 walnuts'] },
      { time: 'Dinner (7:30 PM)',      calories: 380, items: ['1–2 phulka roti', '1 bowl palak dal or vegetable soup', '1 sabzi', 'salad', 'skip rice'] },
      { time: 'Bedtime (10 PM)',       calories: 80,  items: ['1 glass warm haldi milk (low-fat, no sugar)'] },
    ],
    tips: [
      'Drink 3–4 litres of water daily',
      'Avoid sugar, maida, namkeen, and fried foods',
      'Eat dinner before 8 PM',
      'Walk 30 min daily even on rest days',
      'Reduce salt — use sendha namak or rock salt',
    ],
  },

  weight_loss_veg_egg: {
    goal: 'Weight Loss', calories: 1700, protein: 95, carbs: 175, fat: 48,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 30,  items: ['1 glass warm water with lemon', '5 soaked almonds'] },
      { time: 'Breakfast (8 AM)',      calories: 300, items: ['2 boiled eggs (whites only)', '1 moong dal chilla', '1 small bowl dahi', 'green tea'] },
      { time: 'Mid Morning (11 AM)',   calories: 100, items: ['1 seasonal fruit', '1 glass buttermilk'] },
      { time: 'Lunch (1 PM)',          calories: 440, items: ['2 roti', '1 bowl dal', '1 egg bhurji (1 whole + 1 white)', '1 sabzi', 'salad'] },
      { time: 'Pre Workout (5 PM)',    calories: 140, items: ['2 boiled egg whites', '1 banana', 'black coffee'] },
      { time: 'Dinner (7:30 PM)',      calories: 400, items: ['1 roti', '2 eggs omelette with vegetables', '1 bowl vegetable soup', 'salad'] },
      { time: 'Bedtime (10 PM)',       calories: 80,  items: ['1 glass warm haldi milk (low-fat)'] },
    ],
    tips: [
      'Eggs are a great low-calorie protein source',
      'Drink 3–4 litres of water daily',
      'Avoid fried eggs — boil or scramble with minimal oil',
      'No rice at dinner',
      'Walk 30–45 min daily',
    ],
  },

  weight_loss_nonveg: {
    goal: 'Weight Loss', calories: 1750, protein: 110, carbs: 170, fat: 50,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 30,  items: ['1 glass warm water with lemon', '5 soaked almonds'] },
      { time: 'Breakfast (8 AM)',      calories: 320, items: ['3 egg whites + 1 whole egg omelette with vegetables', '1 multigrain roti', 'green tea'] },
      { time: 'Mid Morning (11 AM)',   calories: 100, items: ['1 apple or pear', '1 glass buttermilk'] },
      { time: 'Lunch (1 PM)',          calories: 460, items: ['2 roti', '150g grilled/boiled chicken breast', '1 dal bowl', 'cucumber-tomato salad', '1 small dahi'] },
      { time: 'Pre Workout (5 PM)',    calories: 150, items: ['2 boiled eggs', '1 banana', 'black coffee (no sugar)'] },
      { time: 'Dinner (7:30 PM)',      calories: 420, items: ['1–2 roti', '150g fish curry (rohu/surmai) or chicken soup', '1 sabzi', 'salad', 'no rice'] },
      { time: 'Bedtime (10 PM)',       calories: 80,  items: ['1 glass warm haldi milk (low-fat)'] },
    ],
    tips: [
      'Choose grilled, boiled, or steamed over fried',
      'Avoid red meat during weight loss phase',
      'Drink 3–4 litres water daily',
      'No alcohol — it stops fat burning',
      'Meal prep chicken on Sundays for the week',
    ],
  },

  // ─── MUSCLE GAIN ─────────────────────────────────────────────────────────────

  muscle_gain_veg: {
    goal: 'Muscle Gain', calories: 2800, protein: 140, carbs: 350, fat: 70,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 120, items: ['1 banana', '10 soaked almonds', '5 walnuts', '1 glass warm water'] },
      { time: 'Breakfast (8 AM)',      calories: 600, items: ['4 moong dal chilla with paneer stuffing', '1 bowl dahi', '1 glass full-fat milk', '2 whole wheat toast'] },
      { time: 'Mid Morning (11 AM)',   calories: 250, items: ['1 bowl soya chunks sabzi (50g dry)', '2 roti or 1 banana + 1 glass milk'] },
      { time: 'Lunch (1 PM)',          calories: 700, items: ['3 roti', '1 cup rice', '1 bowl rajma or chana masala', '1 bowl paneer sabzi (100g paneer)', 'salad', '1 bowl dahi'] },
      { time: 'Pre Workout (4:30 PM)', calories: 300, items: ['1 banana', '1 glass milk with 1 tsp honey', 'handful roasted chana'] },
      { time: 'Post Workout',          calories: 250, items: ['1 glass milk with banana shake (no sugar)', '4–5 dates'] },
      { time: 'Dinner (7:30 PM)',      calories: 580, items: ['3 roti', '1 bowl dal (thick)', '1 bowl paneer sabzi', '1 glass milk before bed'] },
    ],
    tips: [
      'Eat every 2.5–3 hours to maintain anabolism',
      'Paneer, soya chunks, rajma, chana are your protein staples',
      'Don\'t skip post-workout nutrition',
      'Sleep 7–8 hours — muscle grows during sleep',
      'Progressive overload — increase weights weekly',
    ],
  },

  muscle_gain_veg_egg: {
    goal: 'Muscle Gain', calories: 3000, protein: 170, carbs: 340, fat: 75,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 150, items: ['3 boiled whole eggs', '1 banana', '5 soaked almonds'] },
      { time: 'Breakfast (8 AM)',      calories: 620, items: ['4 egg omelette with vegetables and cheese', '2 whole wheat parathas (minimal ghee)', '1 glass full-fat milk'] },
      { time: 'Mid Morning (11 AM)',   calories: 280, items: ['2 boiled eggs', '1 bowl soya chunks', '1 banana or 2 dates'] },
      { time: 'Lunch (1 PM)',          calories: 720, items: ['3 roti', '1 bowl rice', '2 eggs bhurji', '1 bowl dal', '1 bowl sabzi', 'salad', 'dahi'] },
      { time: 'Pre Workout (4:30 PM)', calories: 280, items: ['3 egg whites + 1 whole egg omelette', '1 banana', 'black coffee'] },
      { time: 'Post Workout',          calories: 300, items: ['4 boiled eggs', '1 glass milk with banana', '2 dates'] },
      { time: 'Dinner (7:30 PM)',      calories: 650, items: ['3 roti', '1 bowl paneer masala (100g)', '1 bowl dal', '2 boiled eggs', '1 glass warm milk'] },
    ],
    tips: [
      'Aim for 1.8–2g protein per kg body weight',
      'Eggs are the most bioavailable protein — don\'t fear the yolk',
      'Track your calories for the first 2 weeks',
      'Take rest days seriously — they\'re when you grow',
      'Stay hydrated — drink 4+ litres of water',
    ],
  },

  muscle_gain_nonveg: {
    goal: 'Muscle Gain', calories: 3200, protein: 200, carbs: 360, fat: 80,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 180, items: ['4 boiled whole eggs', '1 banana', '10 soaked almonds'] },
      { time: 'Breakfast (8 AM)',      calories: 650, items: ['4 egg omelette with vegetables', '150g boiled chicken keema', '2 multigrain toast', '1 glass full-fat milk'] },
      { time: 'Mid Morning (11 AM)',   calories: 300, items: ['150g grilled chicken breast', '1 banana', '1 glass milk'] },
      { time: 'Lunch (1 PM)',          calories: 800, items: ['3 roti', '1 cup rice', '200g chicken curry', '1 bowl dal', 'salad', '1 dahi'] },
      { time: 'Pre Workout (4:30 PM)', calories: 300, items: ['3 boiled eggs', '1 banana', 'black coffee', 'handful roasted chana'] },
      { time: 'Post Workout',          calories: 350, items: ['200g grilled chicken / fish', '1 banana', '1 glass milk shake'] },
      { time: 'Dinner (7:30 PM)',      calories: 700, items: ['3 roti', '200g fish curry (rohu/surmai)', '1 bowl dal', '2 eggs bhurji', '1 glass warm milk'] },
    ],
    tips: [
      'Chicken breast and fish are your lean muscle-building staples',
      'Aim for 2–2.2g protein per kg body weight',
      'Don\'t eat too close to bedtime — give 2 hrs gap',
      'Creatine monohydrate 3–5g daily is safe and effective',
      'Sleep 8 hours — growth hormone peaks at night',
    ],
  },

  // ─── MAINTENANCE ─────────────────────────────────────────────────────────────

  maintain_veg: {
    goal: 'Maintenance', calories: 2200, protein: 110, carbs: 270, fat: 60,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 80,  items: ['1 glass warm water with lemon', '5 almonds + 2 walnuts'] },
      { time: 'Breakfast (8 AM)',      calories: 450, items: ['2 parathas (aloo/gobi/mixed veg) with minimal ghee', '1 bowl dahi with jeera', '1 glass milk'] },
      { time: 'Mid Morning (11 AM)',   calories: 150, items: ['1 seasonal fruit', '1 glass buttermilk or coconut water'] },
      { time: 'Lunch (1 PM)',          calories: 600, items: ['2–3 roti', '½ cup rice', '1 bowl dal', '1 sabzi', 'salad', '1 bowl dahi'] },
      { time: 'Evening Snack (4 PM)',  calories: 180, items: ['1 bowl roasted chana + makhana', '1 cup green tea or nimbu paani'] },
      { time: 'Dinner (7:30 PM)',      calories: 540, items: ['2–3 roti', '1 bowl paneer sabzi', '1 dal', 'salad', '½ cup curd'] },
      { time: 'Bedtime (10 PM)',       calories: 100, items: ['1 glass warm milk with a pinch of haldi and elaichi'] },
    ],
    tips: [
      'Don\'t skip any meal — consistency is key for maintenance',
      'Seasonal and local foods are your best bet in Himachal',
      'Moderate exercise 4–5 days/week',
      'Keep junk food for once a week only',
      'Stay hydrated even in winters',
    ],
  },

  maintain_veg_egg: {
    goal: 'Maintenance', calories: 2300, protein: 130, carbs: 265, fat: 62,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 80,  items: ['1 glass warm water', '5 almonds', '1 boiled egg'] },
      { time: 'Breakfast (8 AM)',      calories: 480, items: ['2 egg paratha or egg bhurji with 2 roti', '1 bowl dahi', '1 glass tea (less sugar)'] },
      { time: 'Mid Morning (11 AM)',   calories: 140, items: ['1 fruit', '1 glass buttermilk'] },
      { time: 'Lunch (1 PM)',          calories: 600, items: ['2 roti', '½ cup rice', '1 dal', '1 sabzi', '1 boiled egg', 'salad', 'dahi'] },
      { time: 'Evening Snack (4 PM)',  calories: 200, items: ['2 boiled eggs', 'roasted chana', 'green tea'] },
      { time: 'Dinner (7:30 PM)',      calories: 560, items: ['2–3 roti', '2 egg omelette with sabzi', '1 dal', 'salad'] },
      { time: 'Bedtime (10 PM)',       calories: 100, items: ['1 glass warm haldi milk'] },
    ],
    tips: [
      'Eggs add quality protein without heavy cost',
      'Balance veg and egg meals throughout the day',
      'Seasonal fruits are great for micronutrients',
      'Avoid packaged snacks and biscuits',
      'Exercise 5 days/week — mix strength and cardio',
    ],
  },

  maintain_nonveg: {
    goal: 'Maintenance', calories: 2400, protein: 150, carbs: 260, fat: 65,
    meals: [
      { time: 'Early Morning (6 AM)',  calories: 100, items: ['2 boiled eggs', '1 glass warm water with lemon', '5 almonds'] },
      { time: 'Breakfast (8 AM)',      calories: 500, items: ['2 egg omelette with vegetables', '2 multigrain roti or toast', '1 glass milk'] },
      { time: 'Mid Morning (11 AM)',   calories: 150, items: ['1 fruit', '1 glass buttermilk or coconut water'] },
      { time: 'Lunch (1 PM)',          calories: 650, items: ['2–3 roti', '½ cup rice', '150g chicken curry or fish', '1 dal', 'salad', 'dahi'] },
      { time: 'Evening Snack (4 PM)',  calories: 200, items: ['2 boiled eggs', 'roasted chana', '1 cup tea'] },
      { time: 'Dinner (7:30 PM)',      calories: 600, items: ['2–3 roti', '150g grilled fish or chicken', '1 sabzi', 'salad', 'curd'] },
      { time: 'Bedtime (10 PM)',       calories: 100, items: ['1 glass warm haldi milk'] },
    ],
    tips: [
      'Prefer grilled/baked over fried preparations',
      'Local fish like rohu and trout are excellent protein sources',
      'Chicken thighs are cheaper and still nutritious',
      'Exercise 5 days/week — consistency beats intensity',
      'Limit alcohol completely for best results',
    ],
  },
}

// Helper to pick the right template
export function getDietTemplate(goal = 'maintain', dietType = 'veg') {
  const key = `${goal}_${dietType}`
  return DIET_TEMPLATES[key] || DIET_TEMPLATES['maintain_veg']
}

export const GOAL_OPTIONS = [
  { value: 'weight_loss',  label: 'Weight Loss'  },
  { value: 'muscle_gain',  label: 'Muscle Gain'  },
  { value: 'maintain',     label: 'Maintenance'  },
]

export const DIET_TYPE_OPTIONS = [
  { value: 'veg',     label: 'Vegetarian'          },
  { value: 'veg_egg', label: 'Vegetarian + Eggs'   },
  { value: 'nonveg',  label: 'Non-Vegetarian'      },
]
