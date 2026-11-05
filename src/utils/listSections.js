/* Smart sections for shopping lists, like the Groceries list in iPhone
   Reminders: "milk" lands under Dairy & eggs, "apples" under Fruit & veg —
   on its own, offline, with no AI call and no schema change. Sections are
   derived at render time from each item's text, so lists stored before
   this existed group too, and editing an item re-files it instantly.

   A list is only grouped when it looks like a shop: its name says so
   ("Groceries", "Tesco", "Compras"…), or at least two items and half of
   them are recognised. A packing list or a to-do list stays a flat list.

   English (UK/IE) and Portuguese words are both understood; accents,
   quantities ("2x", "500g", "1L") and plurals are ignored. When several
   words match, the longest wins, so "peanut butter" is Pantry, not Dairy,
   and "ice cream" is Frozen. */

export const SECTIONS = [
  { key: "produce", label: "Fruit & veg", color: "#5EC9A7" },
  { key: "bakery", label: "Bakery", color: "#E9A15B" },
  { key: "meat", label: "Meat & fish", color: "#E5735F" },
  { key: "dairy", label: "Dairy & eggs", color: "#7FB5E0" },
  { key: "frozen", label: "Frozen", color: "#9AA9E6" },
  { key: "pantry", label: "Pantry", color: "#C9A26B" },
  { key: "snacks", label: "Snacks & sweets", color: "#F4508C" },
  { key: "drinks", label: "Drinks", color: "#E3B341" },
  { key: "household", label: "Household", color: "#9C8F84" },
  { key: "personal", label: "Personal care", color: "#D08BB8" },
  { key: "baby", label: "Baby", color: "#F0B08A" },
  { key: "pets", label: "Pets", color: "#B08968" },
  { key: "other", label: "Other", color: null },
];

const WORDS = {
  produce: `apple banana orange lemon lime grape strawberry blueberry raspberry blackberry berries cherry peach pear plum kiwi mango pineapple melon watermelon avocado pomegranate fig date grapefruit nectarine apricot coconut passion fruit fruit
    tomato cherry tomatoes potato sweet potato onion red onion spring onion garlic ginger carrot broccoli cauliflower cabbage lettuce spinach kale rocket salad cucumber courgette zucchini aubergine eggplant pepper bell pepper chilli chili mushroom celery leek pea peas green beans beansprouts asparagus beetroot parsnip turnip squash butternut pumpkin corn sweetcorn radish herbs basil parsley coriander cilantro mint rosemary thyme dill chives veg vegetables veggies
    maca banana laranja limao uva morango mirtilo framboesa cereja pessego pera ameixa kiwi manga abacaxi melao melancia abacate roma figo mamao maracuja goiaba tangerina mexerica fruta frutas
    tomate batata batata doce cebola alho gengibre cenoura brocolis couve flor repolho alface espinafre couve rucula pepino abobrinha berinjela pimentao pimenta cogumelo salsao alho poro ervilha vagem aspargo beterraba abobora milho rabanete manjericao salsinha coentro hortela alecrim tomilho cebolinha verdura verduras legume legumes mandioca aipim inhame chuchu quiabo jilo`,
  bakery: `bread loaf sourdough baguette roll rolls bap bagel wrap wraps tortilla pitta pita naan croissant brioche muffin crumpet scone cake doughnut donut bun buns brown bread soda bread
    pao paes pao frances pao de forma bisnaga torrada bolo sonho croissant rosca broa`,
  meat: `chicken chicken breast chicken thighs beef mince steak pork pork chops lamb ham bacon rashers sausage sausages turkey duck salami chorizo prosciutto pepperoni burger burgers meatballs fish salmon tuna steak cod haddock hake prawns shrimp mussels seafood mackerel sea bass trout crab
    frango peito de frango carne carne moida bife porco costela linguica salsicha presunto bacon peru pato picanha alcatra file patinho calabresa peixe salmao bacalhau camarao atum fresco tilapia sardinha fresca`,
  dairy: `milk oat milk almond milk soy milk cheese cheddar mozzarella parmesan feta brie halloumi cream cheese cottage cheese butter yogurt yoghurt greek yogurt cream double cream sour cream creme fraiche egg eggs custard kefir
    leite queijo mussarela parmesao requeijao manteiga iogurte creme de leite nata ovo ovos coalhada ricota`,
  frozen: `ice cream frozen peas frozen pizza frozen chips frozen veg fish fingers ice ice cubes ice lolly ice pops frozen berries frozen
    sorvete picole gelo congelado congelados pizza congelada`,
  pantry: `rice pasta spaghetti penne noodles flour sugar brown sugar salt black pepper oil olive oil vegetable oil vinegar soy sauce ketchup mayo mayonnaise mustard honey jam peanut butter nutella cereal granola oats porridge lentils chickpeas beans baked beans kidney beans tinned tomatoes chopped tomatoes passata tomato puree stock stock cubes gravy spices paprika cumin cinnamon oregano curry powder yeast baking powder baking soda tuna tin tins canned coconut milk quinoa couscous cornflakes crackers breadcrumbs sauce pesto
    arroz macarrao massa espaguete farinha farinha de trigo acucar sal oleo azeite vinagre molho molho de tomate shoyu catchup ketchup maionese mostarda mel geleia pasta de amendoim cereal aveia granola feijao lentilha grao de bico milho em lata extrato de tomate caldo tempero canela oregano fermento cafe em po fuba tapioca farofa farinha de mandioca leite de coco leite condensado sardinha atum em lata`,
  snacks: `crisps chips chocolate biscuits cookies sweets candy popcorn nuts peanuts almonds cashews raisins cereal bars protein bar snack snacks pretzels jelly marshmallows
    biscoito bolacha chocolate bala doce pipoca amendoim castanha nozes salgadinho barra de cereal brigadeiro`,
  drinks: `water sparkling water juice orange juice coffee tea green tea coke cola lemonade soda fizzy drink energy drink beer wine red wine white wine prosecco cider gin vodka whiskey whisky rum kombucha squash
    agua agua com gas suco cafe cha refrigerante coca guarana cerveja vinho espumante cachaca vodka`,
  household: `toilet paper toilet roll kitchen roll paper towels bin bags bin liners washing up liquid dish soap dishwasher tablets laundry detergent washing powder fabric softener bleach cleaner spray sponge sponges cling film tin foil foil baking paper batteries light bulb lightbulb candles matches napkins tissues
    papel higienico papel toalha saco de lixo detergente sabao em po amaciante agua sanitaria desinfetante esponja papel aluminio filme plastico pilha lampada vela guardanapo lenco multiuso alcool`,
  personal: `shampoo conditioner shower gel body wash soap toothpaste toothbrush floss mouthwash deodorant razor razors shaving cream sunscreen suncream moisturiser lotion cotton pads cotton buds tampons pads plasters paracetamol ibuprofen vitamins makeup
    xampu shampoo condicionador sabonete pasta de dente escova de dente fio dental enxaguante desodorante lamina barbeador protetor solar hidratante algodao cotonete absorvente curativo remedio vitamina`,
  baby: `nappies diapers baby wipes wipes formula baby food
    fralda fraldas lenco umedecido papinha`,
  pets: `dog food cat food pet food cat litter treats
    racao areia de gato petisco`,
};

const TITLE_HINTS = /\b(grocer(y|ies)|shop(ping)?|food shop|weekly shop|big shop|supermarket|market|tesco|lidl|aldi|dunnes|supervalu|centra|spar|m&s|sainsbury'?s|asda|waitrose|compras?|mercado|supermercado|mercadinho|feira|sacolao|hortifruti|despensa)\b/;

export const normalizeItemText = (s) => String(s || "")
  .toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\b\d+([.,]\d+)?\s*(x|kg|g|gr|mg|l|lt|ml|cl|pack|packs|pk|un|und|dozen|duzia)?\b/g, " ")
  .replace(/\bx\d+\b/g, " ")
  .replace(/[^a-z&' ]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const PHRASES = {
  produce: ["passion fruit", "sweet potato", "red onion", "spring onion", "bell pepper", "green beans", "cherry tomatoes", "batata doce", "couve flor", "alho poro"],
  bakery: ["brown bread", "soda bread", "pao frances", "pao de forma"],
  meat: ["chicken breast", "chicken thighs", "pork chops", "sea bass", "peito de frango", "carne moida", "sardinha fresca", "atum fresco"],
  dairy: ["oat milk", "almond milk", "soy milk", "cream cheese", "cottage cheese", "greek yogurt", "double cream", "sour cream", "creme fraiche", "creme de leite"],
  frozen: ["ice cream", "frozen peas", "frozen pizza", "frozen chips", "frozen veg", "fish fingers", "ice cubes", "ice lolly", "ice pops", "frozen berries", "pizza congelada"],
  pantry: ["brown sugar", "black pepper", "olive oil", "vegetable oil", "soy sauce", "peanut butter", "baked beans", "kidney beans", "tinned tomatoes", "chopped tomatoes", "tomato puree", "stock cubes", "curry powder", "baking powder", "baking soda", "coconut milk", "farinha de trigo", "molho de tomate", "pasta de amendoim", "grao de bico", "milho em lata", "extrato de tomate", "cafe em po", "farinha de mandioca", "leite de coco", "leite condensado", "atum em lata"],
  snacks: ["cereal bars", "protein bar", "barra de cereal", "doce de leite"],
  drinks: ["sparkling water", "orange juice", "green tea", "fizzy drink", "energy drink", "red wine", "white wine", "agua com gas"],
  household: ["toilet paper", "toilet roll", "kitchen roll", "paper towels", "bin bags", "bin liners", "washing up liquid", "dish soap", "dishwasher tablets", "laundry detergent", "washing powder", "fabric softener", "cleaner spray", "cling film", "tin foil", "baking paper", "light bulb", "papel higienico", "papel toalha", "saco de lixo", "sabao em po", "agua sanitaria", "papel aluminio", "filme plastico"],
  personal: ["shower gel", "body wash", "shaving cream", "cotton pads", "cotton buds", "pasta de dente", "escova de dente", "fio dental", "protetor solar"],
  baby: ["baby wipes", "baby food", "lenco umedecido"],
  pets: ["dog food", "cat food", "pet food", "cat litter", "areia de gato"],
};

/* the word lists above are space-separated, with multi-word phrases
   written inline; those phrases are listed again in PHRASES, so they're
   cut out of the text before splitting — otherwise "doce" from
   "batata doce" would file sweets under Fruit & veg. */
const ALL_PHRASES = Object.values(PHRASES).flat().sort((a, b) => b.length - a.length);
const STOP = new Set(["de", "da", "do", "com", "em", "e", "the", "of", "and"]);
const ENTRIES = Object.entries(WORDS).flatMap(([cat, text]) => {
  let rest = ` ${text.replace(/\s+/g, " ")} `;
  for (const ph of ALL_PHRASES) rest = rest.split(` ${ph} `).join(" ");
  const words = new Set(rest.split(" ").filter((w) => w && !STOP.has(w)));
  return [...words].map((p) => ({ p, cat }));
});

const ALL = [
  ...Object.entries(PHRASES).flatMap(([cat, list]) => list.map((p) => ({ p, cat }))),
  ...ENTRIES,
].sort((a, b) => b.p.length - a.p.length);

/* plural-tolerant variants of the text: "apples" → "apple",
   "tomatoes" → "tomato", "berries" → "berry", "ovos" → "ovo" */
const singular = (w) => {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("oes")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
};

export function categorizeItem(text) {
  const norm = normalizeItemText(text);
  if (!norm) return null;
  const a = ` ${norm} `;
  const b = ` ${norm.split(" ").map(singular).join(" ")} `;
  for (const { p, cat } of ALL) {
    const needle = ` ${p} `;
    if (a.includes(needle) || b.includes(needle) || b.includes(` ${singular(p)} `)) return cat;
  }
  return null;
}

export const isShoppingTitle = (title) => TITLE_HINTS.test(normalizeItemText(title).replace(/\s+/g, " ") || "")
  || TITLE_HINTS.test(String(title || "").toLowerCase());

/* items: [{ text, done }] in stored order. Returns null when the list
   shouldn't be grouped, otherwise the non-empty sections in shop order,
   each with entries { it, ix } — ix is the item's index in the stored
   array, so ticking still writes to the right item. */
export function groupListItems(items, title) {
  const list = items || [];
  if (!list.length) return null;
  const cats = list.map((it) => categorizeItem(it.text));
  const known = cats.filter(Boolean).length;
  const looksLikeShop = isShoppingTitle(title)
    ? known >= 1
    : known >= 2 && known / list.length >= 0.5;
  if (!looksLikeShop) return null;
  return SECTIONS
    .map((s) => ({ ...s, entries: list.map((it, ix) => ({ it, ix })).filter(({ ix }) => (cats[ix] || "other") === s.key) }))
    .filter((s) => s.entries.length);
}
