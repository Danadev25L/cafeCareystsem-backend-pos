"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcrypt");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var users, _i, users_1, userData, hashedPassword, user, tables, _a, tables_1, tableData, table, menuCategories, _b, menuCategories_1, categoryData, menuItems, categoryInfo, category, _c, menuItems_1, itemData;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🌟 Starting enhanced database seeding with images...');
                    // Clear existing data for fresh seed
                    console.log('🧹 Clearing existing data...');
                    return [4 /*yield*/, prisma.menuItem.deleteMany()];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, prisma.menuCategory.deleteMany()];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, prisma.table.deleteMany()];
                case 4:
                    _d.sent();
                    console.log('✅ Cleared existing data');
                    // Create users with different roles
                    console.log('👥 Creating users...');
                    users = [
                        {
                            email: 'admin@cafecare.com',
                            password: 'admin123',
                            name: 'Admin User',
                            role: 'ADMIN',
                        },
                        {
                            email: 'captain@cafecare.com',
                            password: 'captain123',
                            name: 'Captain User',
                            role: 'CAPTAIN',
                        },
                        {
                            email: 'barista@cafecare.com',
                            password: 'barista123',
                            name: 'Barista User',
                            role: 'CASHIER',
                        },
                        {
                            email: 'cashier1@cafecare.com',
                            password: 'cashier123',
                            name: 'Sarah Johnson',
                            role: 'CASHIER',
                        },
                        {
                            email: 'cashier2@cafecare.com',
                            password: 'cashier123',
                            name: 'Mike Wilson',
                            role: 'CASHIER',
                        },
                        {
                            email: 'captain1@cafecare.com',
                            password: 'captain123',
                            name: 'John Davis',
                            role: 'CAPTAIN',
                        },
                    ];
                    _i = 0, users_1 = users;
                    _d.label = 5;
                case 5:
                    if (!(_i < users_1.length)) return [3 /*break*/, 9];
                    userData = users_1[_i];
                    return [4 /*yield*/, bcrypt.hash(userData.password, 12)];
                case 6:
                    hashedPassword = _d.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: __assign(__assign({}, userData), { password: hashedPassword }),
                        })];
                case 7:
                    user = _d.sent();
                    console.log("\uD83D\uDC64 Created user: ".concat(user.email, " (").concat(user.role, ")"));
                    _d.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 5];
                case 9:
                    // Create restaurant tables
                    console.log('🪑 Creating restaurant tables...');
                    tables = [
                        { number: 1, name: 'Window Corner', capacity: 4 },
                        { number: 2, name: 'Garden View', capacity: 2 },
                        { number: 3, name: 'Central Square', capacity: 6 },
                        { number: 4, name: 'Quiet Zone', capacity: 4 },
                        { number: 5, name: 'Bar Seating', capacity: 2 },
                        { number: 6, name: 'Family Table', capacity: 8 },
                        { number: 7, name: 'Business Corner', capacity: 4 },
                        { number: 8, name: 'Date Night', capacity: 2 },
                        { number: 9, name: 'Group Gathering', capacity: 10 },
                        { number: 10, name: 'Solo Spot', capacity: 1 },
                    ];
                    _a = 0, tables_1 = tables;
                    _d.label = 10;
                case 10:
                    if (!(_a < tables_1.length)) return [3 /*break*/, 13];
                    tableData = tables_1[_a];
                    return [4 /*yield*/, prisma.table.create({
                            data: tableData,
                        })];
                case 11:
                    table = _d.sent();
                    console.log("\uD83E\uDE91 Created table: ".concat(table.number, " - ").concat(table.name));
                    _d.label = 12;
                case 12:
                    _a++;
                    return [3 /*break*/, 10];
                case 13:
                    console.log('☕ Creating menu categories with images...');
                    menuCategories = [
                        {
                            titleEn: 'Coffee & Espresso',
                            titleKu: 'قهوه و ئیسپرێسۆ',
                            titleAr: 'قهوة وإسبريسو',
                            description: 'Premium coffee selections from around the world',
                            menuItems: [
                                {
                                    nameEn: 'Classic Espresso',
                                    nameKu: 'ئیسپرێسۆی کلاسیک',
                                    nameAr: 'إسبريسو كلاسيكي',
                                    descriptionEn: 'Rich, bold espresso shot from premium beans',
                                    descriptionKu: 'ئیسپرێسۆی دڵڕەش و بەهێز لە بۆنکی بەرزەوە',
                                    descriptionAr: 'جرعة إسبريسو غنية وقوية من حبوب عالية الجودة',
                                    price: 2.50,
                                    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Cappuccino',
                                    nameKu: 'کاپوچینۆ',
                                    nameAr: 'كابتشينو',
                                    descriptionEn: 'Espresso with steamed milk and perfect foam',
                                    descriptionKu: 'ئیسپرێسۆ لەگەڵ شیرەوەرم و کەفی تەواو',
                                    descriptionAr: 'إسبريسو مع الحليب المطهي ورغوة مثالية',
                                    price: 3.50,
                                    image: 'https://images.unsplash.com/photo-1572442388796-11668a67453a?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Caffè Latte',
                                    nameKu: 'کافه لاتێ',
                                    nameAr: 'كافيه لاتيه',
                                    descriptionEn: 'Smooth espresso with steamed milk',
                                    descriptionKu: 'ئیسپرێسۆی نەرم لەگەڵ شیری گەرم',
                                    descriptionAr: 'إسبريسو ناعم مع الحليب المطهي',
                                    price: 4.00,
                                    image: 'https://images.unsplash.com/photo-1549090357-86e0a4a84603?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Caramel Macchiato',
                                    nameKu: 'کارامێل ماکیاتۆ',
                                    nameAr: 'ماكياتو بالكراميل',
                                    descriptionEn: 'Espresso with vanilla, steamed milk and caramel drizzle',
                                    descriptionKu: 'ئیسپرێسۆ لەگەڵ فانیلا، شیر و کارامێل',
                                    descriptionAr: 'إسبريسو مع الفانيليا والحليب وكراميل',
                                    price: 4.50,
                                    image: 'https://images.unsplash.com/photo-1534793253634-9048b16dfba3?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Americano',
                                    nameKu: 'ئەمەریکانۆ',
                                    nameAr: 'أمريكانو',
                                    descriptionEn: 'Espresso with hot water for a smooth, rich flavor',
                                    descriptionKu: 'ئیسپرێسۆ لەگەڵ ئاوی گەرم بۆ تامێکی نەرم و دڵڕەش',
                                    descriptionAr: 'إسبريسو مع الماء الساخن لنكهة ناعمة وغنية',
                                    price: 3.00,
                                    image: 'https://images.unsplash.com/photo-1494314671902-345aa3f4bdbd?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Mocha',
                                    nameKu: 'مۆکا',
                                    nameAr: 'موكا',
                                    descriptionEn: 'Espresso with chocolate and steamed milk',
                                    descriptionKu: 'ئیسپرێسۆ لەگەڵ چۆکلێت و شیری گەرم',
                                    descriptionAr: 'إسبريسو مع الشوكولاتة والحليب المطهي',
                                    price: 4.25,
                                    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cda9?w=400&h=400&fit=crop&crop=center'
                                }
                            ]
                        },
                        {
                            titleEn: 'Tea & Infusions',
                            titleKu: 'چای و مژە',
                            titleAr: 'شاي والمشروبات',
                            description: 'Fine teas and herbal infusions',
                            menuItems: [
                                {
                                    nameEn: 'Earl Grey Tea',
                                    nameKu: 'چای ئێرل گرێی',
                                    nameAr: 'شاي إيرل جراي',
                                    descriptionEn: 'Black tea with bergamot citrus flavor',
                                    descriptionKu: 'چای ڕەش لەگەڵ تامە cétrus بێرگامۆت',
                                    descriptionAr: 'شاي أسود بنكهة البرغاموت الحمضية',
                                    price: 2.75,
                                    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Green Tea',
                                    nameKu: 'چای سەوز',
                                    nameAr: 'شاي أخضر',
                                    descriptionEn: 'Fresh Japanese green tea leaves',
                                    descriptionKu: 'گەڵای چای سەوزی ژاپۆنی تازە',
                                    descriptionAr: 'أوراق الشاي الأخضر اليابانية الطازجة',
                                    price: 2.50,
                                    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Chamomile Tea',
                                    nameKu: 'چای بابونج',
                                    nameAr: 'شاي البابونج',
                                    descriptionEn: 'Calming herbal tea with honey notes',
                                    descriptionKu: 'چای گیایی ئارامکەرەوە لەگەڵ تامەی عەسل',
                                    descriptionAr: 'شاي عشبي مهدئ بنكهات العسل',
                                    price: 3.00,
                                    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Peppermint Tea',
                                    nameKu: 'چای نەعنا',
                                    nameAr: 'شاي النعناع',
                                    descriptionEn: 'Refreshing peppermint infusion',
                                    descriptionKu: 'مژەی نەعنای تازەگەر',
                                    descriptionAr: 'مشروب النعناع المنعش',
                                    price: 2.75,
                                    image: 'https://images.unsplash.com/photo-1584936982226-eead6155a2ae?w=400&h=400&fit=crop&crop=center'
                                }
                            ]
                        },
                        {
                            titleEn: 'Fresh Pastries',
                            titleKu: 'شیرینی تازە',
                            titleAr: 'معجنات طازجة',
                            description: 'Freshly baked pastries and sweets',
                            menuItems: [
                                {
                                    nameEn: 'Butter Croissant',
                                    nameKu: 'کرواسانی کەرە',
                                    nameAr: 'كرواسان بالزبدة',
                                    descriptionEn: 'Flaky French pastry with rich butter',
                                    descriptionKu: 'شیرینی فەرەنسی هەوایی بە کەری دڵڕەش',
                                    descriptionAr: 'معجنات فرنسية متفتتة بالزبدة الغنية',
                                    price: 3.50,
                                    image: 'https://images.unsplash.com/photo-1555507031-abd07f98321e?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Chocolate Muffin',
                                    nameKu: 'مافینی چۆکلێت',
                                    nameAr: 'مافين الشوكولاتة',
                                    descriptionEn: 'Moist chocolate chip muffin',
                                    descriptionKu: 'مافینی شێدار بە پارچە چۆکلێت',
                                    descriptionAr: 'مافين رطب بالشوكولاتة',
                                    price: 3.25,
                                    image: 'https://images.unsplash.com/photo-1609187994427-24bd89483349?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Blueberry Scone',
                                    nameKu: 'سکۆنی بلووێری',
                                    nameAr: 'سكوين التوت الأزرق',
                                    descriptionEn: 'Traditional scone with fresh blueberries',
                                    descriptionKu: 'سکۆنی کلاسیکی بە بلووێری تازە',
                                    descriptionAr: 'سكوين تقليدي بالتوت الأزرق الطازج',
                                    price: 3.75,
                                    image: 'https://images.unsplash.com/photo-1621877193148-2b6d1df79173?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Cinnamon Roll',
                                    nameKu: 'ڕۆلی دارچین',
                                    nameAr: 'لفائف القرفة',
                                    descriptionEn: 'Sweet roll with cinnamon and cream cheese frosting',
                                    descriptionKu: 'ڕۆلی شیرین بە دارچین و کریمی پەنیر',
                                    descriptionAr: 'لفيفة حلوة بالقرفة وكريمة الجبن',
                                    price: 4.25,
                                    image: 'https://images.unsplash.com/photo-1549938197-3ad2802c32fd?w=400&h=400&fit=crop&crop=center'
                                }
                            ]
                        },
                        {
                            titleEn: 'Gourmet Sandwiches',
                            titleKu: 'ساندویچە گەورەکان',
                            titleAr: 'ساندويتشات فاخرة',
                            description: 'Artisan sandwiches with fresh ingredients',
                            menuItems: [
                                {
                                    nameEn: 'Club Supreme',
                                    nameKu: 'کڵەبی سەرەکی',
                                    nameAr: 'نادي الممتاز',
                                    descriptionEn: 'Triple decker with turkey, bacon, lettuce and tomato',
                                    descriptionKu: 'سێ قەبارە لەگەڵ بێچەک، بێکۆن، کاهوو و تەماتە',
                                    descriptionAr: 'ثلاثي الطوابق مع الديك الرومي واللحم المقدد والخس والطماطم',
                                    price: 9.50,
                                    image: 'https://images.unsplash.com/photo-1549965752-86a52519bf37?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Mediterranean Wrap',
                                    nameKu: 'پێچاوەی مەدیتەرانی',
                                    nameAr: 'لفافة متوسطية',
                                    descriptionEn: 'Grilled chicken, hummus, feta, cucumber and tomato',
                                    descriptionKu: 'مریاوای برژاو، حوموس، فێتا،变得更 و تەماتە',
                                    descriptionAr: 'دجاج مشوي، حمص، جبنة فيتا، خيار وطماطم',
                                    price: 7.50,
                                    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Classic Grilled Cheese',
                                    nameKu: 'پەنیری برژاوی کلاسیک',
                                    nameAr: 'جبن مشوي كلاسيكي',
                                    descriptionEn: 'Three cheese blend on sourdough bread',
                                    descriptionKu: 'تێکەڵانی سێ پەنیر لەسەر نانی خەمیڕ',
                                    descriptionAr: 'خليط من ثلاثة أجبان على خبز الخميرة الحامضة',
                                    price: 6.00,
                                    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Veggie Delight',
                                    nameKu: 'خواردنی سەوزەوات',
                                    nameAr: 'شهوة الخضروات',
                                    descriptionEn: 'Roasted vegetables, avocado spread and sprouts',
                                    descriptionKu: 'سەوزەواتی برژاو، سپرەدی ئەڤاکادۆ و نەعنا',
                                    descriptionAr: 'خضروات مشوية، أفوكادو وبراعم',
                                    price: 7.00,
                                    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop&crop=center'
                                }
                            ]
                        },
                        {
                            titleEn: 'Sweet Desserts',
                            titleKu: 'دێزێرتی شیرین',
                            titleAr: 'حلويات حلوة',
                            description: 'Indulgent desserts and sweet treats',
                            menuItems: [
                                {
                                    nameEn: 'New York Cheesecake',
                                    nameKu: 'کێکی پەنیری نیویۆرک',
                                    nameAr: 'كعكة جبن نيويورك',
                                    descriptionEn: 'Creamy cheesecake with berry compote',
                                    descriptionKu: 'کێکی پەنیری کریمی لەگەڵ سۆسی میوە',
                                    descriptionAr: 'كعكة جبن كريمية مع صلصة التوت',
                                    price: 6.50,
                                    image: 'https://images.unsplash.com/photo-1524188556818-87ca9a2b9c70?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Chocolate Lava Cake',
                                    nameKu: 'کێکی چۆکلێتی لاڤا',
                                    nameAr: 'كعكة بركان الشوكولاتة',
                                    descriptionEn: 'Warm chocolate cake with molten center',
                                    descriptionKu: 'کێکی چۆکلێتی گەرم لەگەڵ ناوەکی خڕاو',
                                    descriptionAr: 'كعكة شوكولاتة دافئة بمركز منصهر',
                                    price: 5.75,
                                    image: 'https://images.unsplash.com/photo-1578984355709-4e99743a1bc2?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Tiramisu',
                                    nameKu: 'تیرامیسو',
                                    nameAr: 'تراميسو',
                                    descriptionEn: 'Classic Italian coffee-flavored dessert',
                                    descriptionKu: 'دێزێرتی کلاسیکی ئیتالی بە تامە قهوه',
                                    descriptionAr: 'حلوى إيطالية كلاسيكية بنكهة القهوة',
                                    price: 6.25,
                                    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Fruit Tart',
                                    nameKu: 'تارتی میوە',
                                    nameAr: 'فطيرة الفاكهة',
                                    descriptionEn: 'Fresh seasonal fruits on pastry cream',
                                    descriptionKu: 'میوەی وەرزی تازە لەسەر کریمی شیرینی',
                                    descriptionAr: 'فواكه موسمية طازجة على كريمة المعجنات',
                                    price: 5.50,
                                    image: 'https://images.unsplash.com/photo-1564701198853-51b99e8d8ad8?w=400&h=400&fit=crop&crop=center'
                                }
                            ]
                        },
                        {
                            titleEn: 'Cold Beverages',
                            titleKu: 'خواردنەوەی سارد',
                            titleAr: 'المشروبات الباردة',
                            description: 'Refreshing cold drinks and smoothies',
                            menuItems: [
                                {
                                    nameEn: 'Iced Coffee',
                                    nameKu: 'قهوه سارد',
                                    nameAr: 'قهوة مثلجة',
                                    descriptionEn: 'Cold brew coffee served over ice',
                                    descriptionKu: 'قهوه‌ی سارد کە لەسەر سەهی دەخرێت',
                                    descriptionAr: 'قهوة باردة تقدم على الثلج',
                                    price: 3.50,
                                    image: 'https://images.unsplash.com/photo-1522701024529-b1e82896f3d6?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Fresh Orange Juice',
                                    nameKu: 'شەربەتی پرتەقاڵی تازە',
                                    nameAr: 'عصير برتقال طازج',
                                    descriptionEn: 'Freshly squeezed orange juice',
                                    descriptionKu: 'شەربەتی پرتەقاڵی تازە دەکراو',
                                    descriptionAr: 'عصير برتقال طازج معصور',
                                    price: 4.00,
                                    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Strawberry Smoothie',
                                    nameKu: 'سمووتی ستاوبێری',
                                    nameAr: 'سموثي الفراولة',
                                    descriptionEn: 'Blended strawberries with yogurt and honey',
                                    descriptionKu: 'ستاوبێری لێکدراو لەگەڵ مەست و عەسل',
                                    descriptionAr: 'فراولة مخلوطة مع الزبادي والعسل',
                                    price: 4.50,
                                    image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=400&fit=crop&crop=center'
                                },
                                {
                                    nameEn: 'Iced Chocolate',
                                    nameKu: 'چۆکلێتی سارد',
                                    nameAr: 'شوكولاتة مثلجة',
                                    descriptionEn: 'Rich chocolate milk with ice',
                                    descriptionKu: 'شیری چۆکلێتی دڵڕەش لەگەڵ سەهی',
                                    descriptionAr: 'حليب الشوكولاتة الغني مع الثلج',
                                    price: 3.75,
                                    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&crop=center'
                                }
                            ]
                        }
                    ];
                    _b = 0, menuCategories_1 = menuCategories;
                    _d.label = 14;
                case 14:
                    if (!(_b < menuCategories_1.length)) return [3 /*break*/, 20];
                    categoryData = menuCategories_1[_b];
                    menuItems = categoryData.menuItems, categoryInfo = __rest(categoryData, ["menuItems"]);
                    return [4 /*yield*/, prisma.menuCategory.create({
                            data: categoryInfo,
                        })];
                case 15:
                    category = _d.sent();
                    console.log("\uD83D\uDCC2 Created category: ".concat(category.titleEn));
                    _c = 0, menuItems_1 = menuItems;
                    _d.label = 16;
                case 16:
                    if (!(_c < menuItems_1.length)) return [3 /*break*/, 19];
                    itemData = menuItems_1[_c];
                    return [4 /*yield*/, prisma.menuItem.create({
                            data: __assign(__assign({}, itemData), { categoryId: category.id }),
                        })];
                case 17:
                    _d.sent();
                    console.log("  \uD83C\uDF7D\uFE0F Created item: ".concat(itemData.nameEn, " (with image)"));
                    _d.label = 18;
                case 18:
                    _c++;
                    return [3 /*break*/, 16];
                case 19:
                    _b++;
                    return [3 /*break*/, 14];
                case 20:
                    console.log('🎉 Enhanced database seeding completed successfully!');
                    console.log('');
                    console.log('📊 Summary:');
                    console.log("   \uD83D\uDC65 Users: ".concat(users.length));
                    console.log("   \uD83E\uDE91 Tables: ".concat(tables.length));
                    console.log("   \uD83D\uDCC2 Categories: ".concat(menuCategories.length));
                    console.log("   \uD83C\uDF7D\uFE0F Menu Items: ".concat(menuCategories.reduce(function (sum, cat) { return sum + cat.menuItems.length; }, 0)));
                    console.log('');
                    console.log('🔑 Login credentials:');
                    console.log('   Admin: admin@cafecare.com / admin123');
                    console.log('   Captain: captain@cafecare.com / captain123');
                    console.log('   Cashier: cashier1@cafecare.com / cashier123');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
