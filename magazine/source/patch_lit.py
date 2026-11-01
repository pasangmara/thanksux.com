# -*- coding: utf-8 -*-
"""Insert article pages (Part 3 + RC/Rover articles) into gen2.py -> gen3.py"""
s = open('/tmp/mag/build/gen2.py', encoding='utf-8').read()

s = s.replace("import sys\n", "import sys\nimport lit as L\n", 1)
s = s.replace("ORG_RV = ", "ORG_LIT = 'শিক্ষক ও শিক্ষার্থীদের লেখা · বরগুনা পলিটেকনিক ইনস্টিটিউট'\nORG_RV = ", 1)

# ---------------- cover lines
s = s.replace("{T(1,9,2,1,'<b>০১</b>রেড ক্রস ও রেড ক্রিসেন্টের জন্ম ইতিহাস','cl w')}\n{T(3,9,2,1,'<b>০২</b>দুর্যোগে মানুষের পাশে: রিমাল, অগ্নিকাণ্ড ও বন্যা','cl')}\n{T(5,9,2,1,'<b>০৩</b>রোভার স্কাউট: সেবা, দীক্ষা ও প্রশিক্ষণ','cl')}",
              "{T(1,9,2,1,'<b>০১</b>দুর্যোগে মানুষের পাশে: রিমাল, অগ্নিকাণ্ড ও বন্যা','cl w')}\n{T(3,9,2,1,'<b>০২</b>রোভার স্কাউট: সেবা, দীক্ষা ও প্রশিক্ষণ','cl')}\n{T(5,9,2,1,'<b>০৩</b>লেখালেখি: প্রবন্ধ, স্মৃতি ও গল্প','cl')}")

# ---------------- contents page
a = s.index("toc1 = [")
b = s.index("# ======================================================== P3 HISTORY")
s = s[:a] + r'''toc1 = [('০৩','রেড ক্রস ও রেড ক্রিসেন্টের জন্ম ইতিহাস','rc21.jpg'),('০৪','আমাদের যাত্রা ও কার্যক্রম','a02.jpg'),
        ('০৬','ঘূর্ণিঝড় রিমাল: ৩৪ ঘণ্টার সেবা','a05.jpg'),('০৮','আগুনের মুখে সাহসী স্বেচ্ছাসেবক','rc04.jpg'),
        ('০৯','ফেনীর বন্যা ও সড়ক দুর্ঘটনায় সেবা','rc24.jpg'),('১০','জাতীয় দুর্যোগ প্রস্তুতি দিবস','rc18.jpg'),
        ('১১','স্বেচ্ছাসেবকের কলমে: দুর্যোগে প্রযুক্তি','a03.jpg'),('১৩','রক্তদান: এক ব্যাগ রক্ত, একটি জীবন','rc15.jpg'),
        ('১৪','প্রাথমিক চিকিৎসা প্রশিক্ষণ – ২০২৫','rc11.jpg'),('১৬','সহশিক্ষা প্রশিক্ষণ ক্যাম্প','a08.jpg'),
        ('১৯','ভর্তি সহায়তা ও ক্যাম্পাস কার্যক্রম','rc01.jpg'),('২৩','পবিত্র রমজানে ইফতার','rc34.jpg'),('২৫','দিবস ও স্মরণ','rc42.jpg')]
toc2 = [('২৮','স্কাউটিং কী ও কেন','rv044.jpg'),('২৯','আমাদের রোভার দল','m010.jpg'),('৩১','দীক্ষা অনুষ্ঠান ও তাঁবুবাস','rv034.jpg'),
        ('৩২','জাতীয় দিবস পালন','rv024.jpg'),('৩৪','সেবা কার্যক্রম','rv029.jpg'),('৩৬','ক্যাম্প ও প্রশিক্ষণ','rv052.jpg')]
toc3 = [('৩৯','দক্ষতাই প্রজন্মের ভবিষ্যৎ'),('৪০','জলবায়ু পরিবর্তনে বাংলাদেশের চ্যালেঞ্জ'),('৪২','বিদ্যুতের আগামীকাল'),
        ('৪৩','চতুর্থ শিল্পবিপ্লব ও কারিগরি শিক্ষা'),('৪৫','জ্ঞান যখন দক্ষতার শক্তি'),('৪৬','ডিপ্লোমা ইন ইঞ্জিনিয়ারিং'),
        ('৪৭','ছোট লেখা, বড় ভাবনা'),('৪৮','একটি ইটের আত্মকথা'),('৪৯','রেজিস্টর ও ক্যাম্পাসের গল্প'),
        ('৫০','অন্তিম ঘণ্টার গল্প ও আমার মা'),('৫১','আমাদের ভালোবাসার ঠিকানা'),('৫৩','তিনটি ছোট গল্প'),('৫৪','কর্মের ফল')]
def toc(items, th):
    return ''.join(f'<div class="ti {th}"><span class="tth"><img src="img/{im}"></span><span class="ttl">{t}</span><span class="tpg">{p}</span></div>' for p,t,im in items)
def toct(items, th):
    return ''.join(f'<div class="ti tx {th}"><span class="ttl">{t}</span><span class="tpg">{p}</span></div>' for p,t in items)
page('সূচিপত্র', f"""
{T(1,1,4,1,'<div class="kicker">এই সংখ্যায়</div><div class="big">সূচিপত্র</div>')}
<div class="badge" style="{g(5,1,2,2)}"><b>২০২৬</b>বার্ষিক ম্যাগাজিন<br>সংখ্যা ০১</div>
{T(1,2,3,7,'<div class="parthd">প্রথম পর্ব · যুব রেড ক্রিসেন্ট</div>'+toc(toc1,'rc'))}
{T(4,3,3,2,'<div class="parthd nv">দ্বিতীয় পর্ব · রোভার স্কাউট</div>'+toct([(p,t) for p,t,_ in toc2],'nv'))}
{T(4,5,3,4,'<div class="parthd ink">তৃতীয় পর্ব · লেখালেখি</div>'+toct(toc3,'lt'))}
""")

''' + s[b:]

# ---------------- RC article after disaster day
mark = "# ======================================================== P11 BLOOD"
s = s.replace(mark, r'''# ======================================================== RC ARTICLE (volunteer)
page('স্বেচ্ছাসেবকের কলমে', f"""
{L.header('disaster',1,1,6,2,size=23)}
{L.FL('disaster',1,1,3,4,6,cols=2)}
{L.pull('disaster',5,3,2,2,size=12.5)}
{T(5,5,2,4,'<div class="kicker">যে প্রযুক্তিগুলো কাজে লাগে</div><div class="techlist"><span>স্যাটেলাইট ও আবহাওয়া পর্যবেক্ষণ</span><span>মোবাইল বার্তা ও জরুরি সাইরেন</span><span>ভৌগোলিক তথ্য ব্যবস্থা (GIS) ও জিপিএস</span><span>ডিজিটাল ম্যাপিং</span><span>ড্রোন</span><span>ডিজিটাল ডাটাবেজ</span><span>ওয়াকি টকি ও মাইকিং</span></div>','note')}
""")
page('স্বেচ্ছাসেবকের কলমে', f"""
{L.FL('disaster',2,1,1,6,5,cols=3)}
{F('a05.jpg',1,6,3,2,'bl','50% 50%','ঘূর্ণিঝড় রিমালের সময় আশ্রয়কেন্দ্রে স্বেচ্ছাসেবকেরা')}
{F('rc23.jpg',4,6,3,2,'br','50% 45%','দুর্যোগকালীন প্রাথমিক চিকিৎসা ও উদ্ধার')}
{T(1,8,6,1,Q('প্রযুক্তি হোক দুর্যোগ মোকাবিলার হাতিয়ার, আর মানবতা হোক আমাদের সবচেয়ে বড় শক্তি।',14),'panel wide mid')}
""")

''' + mark, 1)

# ---------------- Rover article after rover opener
mark = "def mem(img, c, r, name, role, dept):"
bpq = ''.join(f'<p>{q}</p>' for q in ['“এই বিশ্বকে তুমি যেমন পেয়েছো, তার চেয়ে একটু ভালো অবস্থায় রেখে যাওয়ার চেষ্টা করো।”',
      '“খুশি থাকার আসল উপায় হলো অন্যকে খুশি করা।”', '“কোনো কাজ অসম্ভব নয়, যদি তুমি তা চেষ্টা করতে প্রস্তুত থাকো।”',
      '“প্রকৃতি হলো সৃষ্টিকর্তার তৈরি সবচেয়ে বড় খোলা পাঠশালা, যেখানে আমরা তার রূপ ও অসীম শক্তি দেখতে পাই।”'])
s = s.replace(mark, r'''page('রোভারের কলমে', f"""
{L.header('scouting',1,1,6,2,size=23)}
{L.FL('scouting',1,1,3,4,6,cols=2)}
{T(5,3,2,4,'<div class="kicker w">লর্ড ব্যাডেন পাওয়েল (বিপি)-এর বাণী</div>''' + bpq + r'''','bpq')}
{F('rv044.jpg',5,7,2,2,'','50% 50%','হাইকিং ২০২৬')}
""", theme='nv')

''' + mark, 1)

# ---------------- Part 3 before membership
mark = "# ======================================================== P35 MEMBERSHIP (inset red)"
part3 = r'''# ======================================================== PART 3: লেখালেখি
def lst(title, items):
    return f'<div class="lst"><h5>{title}</h5>' + ''.join(f'<div><span>{t}</span><b>{p}</b></div>' for p,t in items) + '</div>'
page('তৃতীয় পর্ব', f"""
{T(1,1,4,2,'<div class="kicker w">তৃতীয় পর্ব</div><div class="optitle serifT">লেখালেখি</div><div class="opsub">শিক্ষক ও শিক্ষার্থীদের কলমে প্রবন্ধ, ভাবনা, স্মৃতি ও গল্প</div>')}
{T(5,1,2,2,'<div class="giantmark">“</div>','end right')}
{T(1,4,2,4,lst('প্রবন্ধ',[('৩৯','দক্ষতাই প্রজন্মের ভবিষ্যৎ'),('৪০','জলবায়ু পরিবর্তনে বাংলাদেশের চ্যালেঞ্জ'),('৪২','বিদ্যুতের আগামীকাল'),('৪৩','চতুর্থ শিল্পবিপ্লব'),('৪৫','জ্ঞান যখন দক্ষতার শক্তি'),('৪৬','ডিপ্লোমা ইন ইঞ্জিনিয়ারিং'),('৪৬','কারিগরি শিক্ষা')]))}
{T(3,4,2,4,lst('ভাবনা ও স্মৃতি',[('৪৭','স্মার্ট ই-ওয়েস্ট রিসাইক্লিং'),('৪৭','স্মার্টফোন ও আমাদের সময়'),('৪৭','সিভিল শিক্ষার্থীর অনুভূতি'),('৪৮','একটি ইটের আত্মকথা'),('৪৯','রেজিস্টরের চেয়ে বড় স্বপ্ন'),('৪৯','আলো ও স্মৃতির আঙিনা'),('৫০','অন্তিম ঘণ্টার গল্প'),('৫০','আমার মা'),('৫১','আমাদের ভালোবাসার ঠিকানা')]))}
{T(5,4,2,4,lst('গল্প',[('৫৩','এক মুঠো বীজ'),('৫৩','একমুঠো সততা'),('৫৩','বরফ শহরের স্বপ্ন'),('৫৪','কর্মের ফল')]))}
{T(1,8,6,1,Q('কলমের আঁচড়ে উঠে আসুক দক্ষতা, মানবিকতা আর স্বপ্নের কথা।',15,True),'mid')}
""", theme='lit', inset='char')

page('লেখালেখি', f"""
{T(1,1,6,1,'<div class="kicker">শিক্ষকের কলম</div><h1 class="serif" style="font-size:28pt">দক্ষতাই প্রজন্মের ভবিষ্যৎ</h1>','end')}
{T(1,2,6,3,'<div class="giantq">“জ্ঞান পথ দেখায়,<br>দক্ষতা পথ তৈরি করে।”</div>','mid')}
{L.FL('dokkhota',1,1,5,6,2,cols=2)}
{T(1,7,2,2,L.byline('dokkhota'),'note end')}
{T(3,7,4,2,Q('আর দক্ষ হাতেই গড়ে উঠবে আগামীর বাংলাদেশ।',18),'panel mid')}
""", theme='lit')

page('লেখালেখি', f"""
{L.header('climate',1,1,6,2,size=25)}
{F('climate1.jpg',1,3,3,2,'tl','50% 50%')}
{F('climate2.jpg',4,3,3,2,'tr','50% 50%')}
{L.FL('climate',1,1,5,6,4,cols=3)}
""", theme='lit')
page('লেখালেখি', f"""
{T(1,1,2,1,'<b>০.৫%</b><span>এর কম: বৈশ্বিক গ্রিনহাউস গ্যাস নিঃসরণে বাংলাদেশের অবদান</span>','st red')}
{T(3,1,2,1,'<b>৯%</b><span>২০৫০ সালের মধ্যে জিডিপি ক্ষতির আশঙ্কা (বিশ্বব্যাংক)</span>','st')}
{T(5,1,2,1,'<b>২ কোটি</b><span>২০৫০ সালের মধ্যে সম্ভাব্য জলবায়ু উদ্বাস্তু</span>','st')}
{L.FL('climate',2,1,2,4,4,cols=2)}
{T(1,6,4,3,'<div class="kicker">প্রশমন ও অভিযোজনে করণীয়</div><div class="chipgrid"><span>নবায়নযোগ্য জ্বালানির ব্যবহার বৃদ্ধি</span><span>সৌর বিদ্যুৎ চালিত সেচ পাম্প ও রাস্তার বাতি</span><span>আইপিএস-এর বিকল্প হিসেবে সৌর বিদ্যুৎ</span><span>বায়োগ্যাস প্ল্যান্ট</span><span>আন্তর্জাতিক সহযোগিতা ও জলবায়ু তহবিল</span><span>কার্যকর ও টেকসই নীতি বাস্তবায়ন</span></div>','note')}
{L.pull('climate',5,2,2,3,size=12)}
{T(5,5,2,4,'<div class="kicker">তথ্যসূত্র</div><ol class="refs">' + ''.join(f'<li>{r}</li>' for r in L.PIECES['climate']['refs']) + '</ol>','note')}
""", theme='lit')

page('লেখালেখি', f"""
{L.header('renewable',1,1,6,2,size=25)}
{L.FL('renewable',1,1,3,6,4,cols=3)}
{L.pull('renewable',1,7,4,2,size=12.5)}
{T(5,7,2,2,'<div class="sun"></div><div class="sunlbl">সূর্য · বাতাস · পানি</div>','suntile')}
""", theme='lit')

page('লেখালেখি', f"""
{L.header('4ir',1,1,4,2,size=24)}
{T(5,1,2,2,'<b>৪.০</b><span>Industry 4.0</span>','flag big')}
{L.FL('4ir',1,1,3,4,6,cols=2)}
{T(5,3,2,3,'<div class="kicker">মূল প্রযুক্তি</div><div class="techlist"><span>কৃত্রিম বুদ্ধিমত্তা (AI)</span><span>রোবটিক্স</span><span>ইন্টারনেট অফ থিংস (IoT)</span><span>ক্লাউড কম্পিউটিং</span><span>বিগ ডেটা</span><span>অটোমেশন</span></div>','note')}
{T(5,6,2,3,'<b>AI · IoT</b>রোবটিক্স, ক্লাউড কম্পিউটিং, বিগ ডেটা ও অটোমেশন: চতুর্থ শিল্পবিপ্লবের মূল ভিত্তি','flag')}
""", theme='lit')
page('লেখালেখি', f"""
{L.FL('4ir',2,1,1,4,3,cols=2)}
{L.pull('4ir',5,1,2,3,size=12)}
{T(1,7,6,2,'<div class="kicker">যে দক্ষতাগুলো কাজে লাগবে</div><div class="chipgrid three"><span>প্রোগ্রামিং</span><span>গ্রাফিক ডিজাইন</span><span>ওয়েব ডেভেলপমেন্ট</span><span>CAD</span><span>ডেটা অ্যানালাইসিস</span><span>সমস্যা সমাধানের দক্ষতা</span><span>সৃজনশীল চিন্তা</span><span>যোগাযোগ দক্ষতা</span><span>দলগতভাবে কাজ</span></div>','note')}
{T(1,4,6,3,'<div class="kicker" style="grid-column:1/-1">চার শিল্পবিপ্লব</div><div><b>১ম</b><span>বাষ্পীয় ইঞ্জিন</span></div><div><b>২য়</b><span>বিদ্যুৎ ও গণউৎপাদন</span></div><div><b>৩য়</b><span>কম্পিউটার ও তথ্যপ্রযুক্তি</span></div><div><b>৪র্থ</b><span>AI, রোবটিক্স, IoT ও অটোমেশন</span></div>','tline four')}
""", theme='lit')

page('লেখালেখি', f"""
{L.header('gyan',1,1,6,2,size=28)}
{L.FL('gyan',1,1,3,6,4,cols=3)}
{L.pull('gyan',1,7,4,2,size=13.5)}
{T(5,7,2,2,'<b>জ্ঞান ও দক্ষতা</b>এই সমন্বয়ই কারিগরি শিক্ষার অন্যতম বড় শক্তি','flag')}
""", theme='lit')

page('লেখালেখি', f"""
{L.header('diploma',1,1,6,1,size=21,deck=False)}
{L.FL('diploma',1,1,2,6,3,cols=3)}
{L.pull('diploma',1,5,6,1,size=12,cls='wide')}
{L.header('karigori',1,6,6,1,size=19,deck=False)}
{L.FL('karigori',1,1,7,4,2,cols=2)}
{T(5,7,2,2,'<div class="pq-mark">“</div><div class="serifq">দক্ষতাই হোক ভবিষ্যতের পরিচয়, আর কারিগরি শিক্ষাই হোক সেই দক্ষতা অর্জনের অন্যতম মাধ্যম।</div>','panel mid')}
""", theme='lit')

page('লেখালেখি', f"""
{T(1,1,6,1,'<div class="kicker">ভাবনা</div><h1 class="serif" style="font-size:26pt">ছোট লেখা, বড় ভাবনা</h1>','end')}
{L.header('ewaste',1,2,3,1,size=16,deck=False)}
{L.FL('ewaste',1,1,3,3,3,cols=1)}
{L.header('smartphone',4,2,3,1,size=14,deck=False)}
{L.FL('smartphone',1,4,3,3,3,cols=1)}
{L.pull('smartphone',1,6,6,1,size=12,cls='wide')}
{L.header('civil',1,7,2,2,size=15,deck=False)}
{L.FL('civil',1,3,7,4,2,cols=2)}
""", theme='lit')

page('লেখালেখি', f"""
{L.header('brick',1,1,4,2,size=25)}
{T(5,1,2,2,'','bricks')}
{L.FL('brick',1,1,3,4,6,cols=2)}
{L.pull('brick',5,3,2,3,size=12.5)}
{T(5,6,2,3,'<div><b>০১</b><span>মাটি থেকে ইট</span></div><div><b>০২</b><span>আগুনের পরীক্ষা</span></div><div><b>০৩</b><span>পরীক্ষা ও পরিবহন</span></div><div><b>০৪</b><span>নির্মাণে ভূমিকা</span></div><div><b>০৫</b><span>আমার উপলব্ধি</span></div>','nlist mid')}
""", theme='lit')

page('লেখালেখি', f"""
{L.header('resistor',1,1,4,1,size=19,deck=False)}
{L.FL('resistor',1,1,2,4,3,cols=2)}
{T(5,1,2,3,'<div class="pq-mark">“</div><div class="serifq">আমি ইলেকট্রনিক্সের ছাত্র, আমি ভবিষ্যৎ বানাই।</div>','panel ink mid')}
{L.header('campus',1,5,4,1,size=19,deck=False)}
{L.FL('campus',1,1,6,4,3,cols=2)}
{F('rv037.jpg',5,5,2,4,'','50% 50%','বরগুনা পলিটেকনিক ইনস্টিটিউট, বরগুনা')}
""", theme='lit')

page('লেখালেখি', f"""
{L.header('ontim',1,1,6,1,size=21,deck=False)}
{L.FL('ontim',1,1,2,6,3,cols=3)}
{L.header('ma',1,5,2,2,size=22,deck=False)}
{L.FL('ma',1,3,5,4,2,cols=2)}
{T(1,7,6,2,Q('ক্যাম্পাস একই থাকবে, বদলে যাবো শুধু আমরা। তাই বিদায় নয়—এটাই আমাদের গল্পের নতুন অধ্যায়ের সূচনা।',16),'panel wide mid')}
""", theme='lit')

page('লেখালেখি', f"""
{F('rc05.jpg',1,1,6,4,'','50% 45%')}
{L.header('thikana',1,4,4,2,size=27,deck=False,cls='overpanel')}
{L.FL('thikana',1,1,6,6,3,cols=3)}
""", theme='lit')
page('লেখালেখি', f"""
{L.FL('thikana',2,1,1,4,3,cols=2)}
{L.pull('thikana',5,1,2,3,size=13)}
{F('a02.jpg',1,4,3,5,'bl','50% 60%','ক্যাম্পাসে শিক্ষার্থীরা')}
{F('rv037.jpg',4,4,3,5,'br','50% 50%','বরগুনা পলিটেকনিক ইনস্টিটিউট')}
""", theme='lit')

def story(pid, c, n):
    p = L.PIECES[pid]
    return (T(c,2,2,2,f'<div class="snum">{n}</div><div class="kicker">{p["cat"]}</div><h1 class="serif" style="font-size:18pt">{p["title"]}</h1>{L.byline(pid)}','end')
            + L.FL(pid,1,c,4,2,4,cols=1))
page('লেখালেখি', f"""
{T(1,1,6,1,'<div class="kicker">গল্প</div><h1 class="serif" style="font-size:28pt">তিনটি ছোট গল্প</h1>','end')}
{story('bij',1,'০১')}{story('sototа',3,'০২')}{story('borof',5,'০৩')}
{T(1,8,6,1,Q('ছোট একটি ভালো কাজও একদিন অনেক বড় সৌন্দর্য সৃষ্টি করতে পারে।',14),'panel wide mid')}
""", theme='lit')

page('লেখালেখি', f"""
{T(1,1,6,2,'<div class="kicker">গল্প</div><h1 class="serif" style="font-size:34pt">কর্মের ফল</h1><div class="deck">এক রাজা, তিন মন্ত্রী আর তিন বস্তা ফলের গল্প।</div>'+L.byline('karmer'),'end')}
{L.FL('karmer',1,1,3,4,6,cols=2)}
{T(5,3,2,6,'<div><b>১ম</b><span>বেছে বেছে ভালো ফল সংগ্রহ: সুস্বাস্থ্যের অধিকারী হল</span></div><div><b>২য়</b><span>উপরে ভালো, ভেতরে পচা ফল: শরীর নষ্ট করল</span></div><div><b>৩য়</b><span>বস্তায় শুকনা পাতা: না খেয়ে মারা পড়ল</span></div>','nlist mid big')}
""", theme='lit')

'''
s = s.replace(mark, part3 + mark, 1)

# ---------------- templates + flow js + header org for lit theme
s = s.replace("        org = ORG_RV if p['theme'] == 'nv' else ORG_RC",
              "        org = ORG_RV if p['theme'] == 'nv' else (ORG_LIT if p['theme'] == 'lit' else ORG_RC)")
s = s.replace("out.append('</body></html>')",
              "out.append(''.join(L.template(pid, 'লর্ড' if pid=='scouting' else None) for pid in L.PIECES))\nout.append(L.FLOW_JS)\nout.append('</body></html>')")
s = s.replace("'tiro-bangla/400.css','tiro-bangla/400-italic.css']",
              "'tiro-bangla/400.css','tiro-bangla/400-italic.css','noto-serif-bengali/700.css','noto-serif-bengali/800.css']")
s = s.replace("open('mag2-grid.html' if grid else 'mag2.html'", "open('mag3-grid.html' if grid else 'mag3.html'")
s = s.replace("CSS = open('mag2.css', encoding='utf-8').read()", "CSS = open('mag2.css', encoding='utf-8').read() + open('lit.css', encoding='utf-8').read()")
open('/tmp/mag/build/gen3.py', 'w', encoding='utf-8').write(s)
print('ok', s.count("page("))
