// 9 templates: 3 goals × 3 diet types
// key format: {goal}_{dietType}

export const DIET_TEMPLATES = {
  // ─── WEIGHT LOSS ────────────────────────────────────────────────────────────
  weight_loss_non_veg: {
    name: 'Weight Loss — Non-Veg',
    calories: 1600,
    macros: { protein: 130, carbs: 140, fat: 45 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['4 egg whites + 1 whole egg omelette', '2 slices brown bread', '1 cup green tea (no sugar)'],
        calories: 320,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 medium apple', '10 almonds'],
        calories: 160,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['200g grilled chicken breast', '1 cup brown rice', 'Cucumber-tomato salad', '1 small bowl dal'],
        calories: 480,
      },
      {
        time: 'Evening Snack (4–5 PM)',
        items: ['1 scoop whey protein (low-cal)', '1 banana'],
        calories: 240,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['200g fish (grilled / baked)', '2 rotis (wheat)', 'Steamed vegetables', '1 cup low-fat curd'],
        calories: 400,
      },
    ],
    tips: [
      'Drink 3–4 litres of water daily',
      'Avoid sugar, maida, fried items',
      'Walk 8,000+ steps every day',
      'Do not skip breakfast',
    ],
  },

  weight_loss_veg: {
    name: 'Weight Loss — Vegetarian',
    calories: 1500,
    macros: { protein: 100, carbs: 150, fat: 40 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['Moong dal chilla (3 pieces)', '1 cup low-fat curd', '1 cup green tea'],
        calories: 300,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 orange or guava', '1 tbsp peanut butter on rice cake'],
        calories: 150,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['2 multigrain rotis', '1 cup palak paneer (low-oil)', '1 bowl mixed vegetable sabzi', 'Salad'],
        calories: 450,
      },
      {
        time: 'Evening Snack (4–5 PM)',
        items: ['1 cup sprouts chaat', '1 cup buttermilk'],
        calories: 200,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['1 cup dal tadka', '2 phulkas', 'Steamed broccoli & beans', '1 cup curd'],
        calories: 400,
      },
    ],
    tips: [
      'Include paneer, dal, sprouts for protein',
      'Limit rice — prefer roti',
      'Avoid ghee / butter in excess',
      'Sleep 7–8 hours for fat loss',
    ],
  },

  weight_loss_vegan: {
    name: 'Weight Loss — Vegan',
    calories: 1450,
    macros: { protein: 85, carbs: 155, fat: 38 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['Oats porridge with almond milk', '1 tbsp chia seeds', '½ banana', '1 cup black coffee'],
        calories: 290,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 apple', '1 handful mixed nuts'],
        calories: 160,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['1 cup rajma / chickpea curry', '1 cup brown rice', 'Cucumber-lemon salad', 'Stir-fried veggies'],
        calories: 440,
      },
      {
        time: 'Evening Snack (4–5 PM)',
        items: ['Hummus with carrot & cucumber sticks', '1 cup green tea'],
        calories: 180,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['Tofu stir-fry (200g) with peppers', '2 chapatis (wheat-jowar mix)', '1 bowl soup'],
        calories: 380,
      },
    ],
    tips: [
      'Supplement B12, Vitamin D, Omega-3',
      'Include tofu, legumes, seeds for protein',
      'Avoid packaged vegan junk food',
      'Cook with minimal oil',
    ],
  },

  // ─── MUSCLE GAIN ────────────────────────────────────────────────────────────
  muscle_gain_non_veg: {
    name: 'Muscle Gain — Non-Veg',
    calories: 2800,
    macros: { protein: 200, carbs: 310, fat: 70 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['6 whole eggs scrambled', '4 slices whole wheat bread', '1 glass whole milk', '1 banana'],
        calories: 680,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 scoop whey protein with milk', '30g oats', '1 tbsp peanut butter'],
        calories: 380,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['300g chicken breast (grilled)', '1½ cups white rice', '2 rotis', '1 bowl dal', 'Salad + curd'],
        calories: 750,
      },
      {
        time: 'Pre-Workout (4–5 PM)',
        items: ['2 boiled eggs', '1 banana', '1 slice bread with peanut butter'],
        calories: 340,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['200g mutton / fish', '2 cups rice', '2 rotis', 'Sabzi', '1 glass milk before bed'],
        calories: 650,
      },
    ],
    tips: [
      'Eat within 45 min after workout',
      'Progressive overload in gym — track lifts',
      'Sleep 8 hours for muscle recovery',
      'Stay consistent — results take 3–4 months',
    ],
  },

  muscle_gain_veg: {
    name: 'Muscle Gain — Vegetarian',
    calories: 2600,
    macros: { protein: 160, carbs: 300, fat: 65 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['Paneer bhurji (200g)', '4 multigrain rotis', '1 glass whole milk', '1 banana'],
        calories: 650,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 cup Greek yoghurt', '30g mixed nuts', '1 fruit'],
        calories: 350,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['2 cups rice', '1 cup rajma / chole', '100g paneer sabzi', '2 rotis', 'Salad + raita'],
        calories: 720,
      },
      {
        time: 'Pre-Workout (4–5 PM)',
        items: ['1 scoop plant protein / whey-veg', '1 banana', '1 slice bread'],
        calories: 330,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['Soya chunks curry (200g)', '2 cups rice', '2 phulkas', '1 cup dal', '200ml milk'],
        calories: 650,
      },
    ],
    tips: [
      'Paneer, soya, dal, milk — essential protein sources',
      'Eat every 3–4 hours',
      'Track weight weekly — aim 0.3 kg/week gain',
      'Do not skip post-workout meal',
    ],
  },

  muscle_gain_vegan: {
    name: 'Muscle Gain — Vegan',
    calories: 2600,
    macros: { protein: 140, carbs: 330, fat: 65 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['Tofu scramble (250g)', '4 whole wheat rotis', '1 glass soy milk + banana smoothie'],
        calories: 640,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 scoop vegan protein with oat milk', '50g oats cooked', '1 tbsp almond butter'],
        calories: 380,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['2 cups rice', '1 cup chickpea / black bean curry', 'Roasted vegetables', '2 rotis', 'Hummus'],
        calories: 720,
      },
      {
        time: 'Pre-Workout (4–5 PM)',
        items: ['Banana + dates (3–4)', '1 slice bread with peanut butter'],
        calories: 320,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['Tempeh / tofu stir-fry (200g)', '2 cups rice', '1 cup lentil soup', '2 chapatis'],
        calories: 640,
      },
    ],
    tips: [
      'Supplement creatine, B12, Vitamin D, Omega-3 (algae)',
      'Combine grains + legumes for complete protein',
      'Caloric surplus of 300–400 kcal for lean gain',
      'Track protein — aim 2g per kg body weight',
    ],
  },

  // ─── MAINTENANCE ────────────────────────────────────────────────────────────
  maintenance_non_veg: {
    name: 'Maintenance — Non-Veg',
    calories: 2200,
    macros: { protein: 155, carbs: 240, fat: 60 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['3 whole eggs + 2 whites', '2 slices whole wheat toast', '1 cup milk or green tea', '1 fruit'],
        calories: 490,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 cup curd with fruit', '10–12 almonds'],
        calories: 200,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['200g chicken / fish', '1 cup rice', '2 rotis', 'Dal + sabzi', 'Salad'],
        calories: 620,
      },
      {
        time: 'Evening Snack (4–5 PM)',
        items: ['1 scoop whey / protein shake', '1 banana'],
        calories: 280,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['150g lean meat / eggs (3)', '2 rotis', 'Vegetable curry', '1 cup curd'],
        calories: 510,
      },
    ],
    tips: [
      'Maintain current weight ± 1 kg',
      'Adjust ± 200 kcal if trending up/down',
      'Stay consistent with training',
      'Hydrate well: 3 litres/day minimum',
    ],
  },

  maintenance_veg: {
    name: 'Maintenance — Vegetarian',
    calories: 2100,
    macros: { protein: 120, carbs: 250, fat: 58 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['2 paneer parathas (small)', '1 cup curd', '1 glass milk'],
        calories: 480,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 cup sprouts salad', '1 fruit'],
        calories: 180,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['1 cup rice', '2 rotis', 'Paneer / soya sabzi', 'Dal', 'Curd + salad'],
        calories: 600,
      },
      {
        time: 'Evening Snack (4–5 PM)',
        items: ['1 cup chana chat', '1 glass buttermilk'],
        calories: 240,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['2 rotis', '1 cup dal makhani (low oil)', 'Mixed vegetables', '1 cup curd'],
        calories: 500,
      },
    ],
    tips: [
      'Balance meals across the day',
      'Include at least 1 protein source per meal',
      'Limit refined sugar and maida',
      'Exercise 4–5 days/week to maintain body composition',
    ],
  },

  maintenance_vegan: {
    name: 'Maintenance — Vegan',
    calories: 2050,
    macros: { protein: 105, carbs: 265, fat: 55 },
    meals: [
      {
        time: 'Breakfast (7–8 AM)',
        items: ['Overnight oats with almond milk & berries', '2 tbsp flax + chia seeds', '1 cup black coffee'],
        calories: 420,
      },
      {
        time: 'Mid-Morning (10–11 AM)',
        items: ['1 apple or pear', '1 tbsp peanut butter'],
        calories: 180,
      },
      {
        time: 'Lunch (1–2 PM)',
        items: ['1 cup brown rice', '1 cup dal / legume curry', 'Roasted vegetables', '2 chapatis', 'Salad'],
        calories: 600,
      },
      {
        time: 'Evening Snack (4–5 PM)',
        items: ['Hummus (3 tbsp) + veggie sticks', '1 small banana'],
        calories: 220,
      },
      {
        time: 'Dinner (7–8 PM)',
        items: ['Tofu / tempeh curry (150g)', '1½ cups rice', '2 chapatis', '1 bowl vegetable soup'],
        calories: 530,
      },
    ],
    tips: [
      'Rotate protein sources: lentils, chickpeas, tofu, tempeh',
      'Supplement B12, D3, Zinc, Omega-3 (algae)',
      'Eat varied whole foods to cover all micronutrients',
      'Check weight monthly — adjust calories if needed',
    ],
  },
}
