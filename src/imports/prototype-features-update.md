Update the entire prototype with these new features using real-world data:

1. Add 100+ universities from diverse countries (based on real rankings like Times Higher Education 2026 and CWUR 2025). Simulate a large scrollable/paginated list in Universities List and Student Home. Include top schools from:
   - USA: Harvard, MIT, Stanford, Princeton, Caltech, Yale, UC Berkeley, Columbia, UCLA, UChicago (top 10+ more)
   - UK: Oxford, Cambridge, Imperial College London, UCL, Edinburgh
   - Australia: University of Melbourne, Sydney, Queensland, ANU
   - China: Tsinghua, Peking, Fudan, Shanghai Jiao Tong
   - South Korea: Seoul National University, KAIST, Korea University
   - Canada: University of Toronto, McGill, UBC
   - Germany: LMU Munich, Heidelberg, Technical University of Munich
   - France: PSL University, Sorbonne, École Normale Supérieure
   - Japan: University of Tokyo, Kyoto University
   - Vietnam: Vietnam National University Hanoi, Ho Chi Minh City University of Technology
   - Others: ETH Zurich (Switzerland), NUS (Singapore), etc. (aim for 100 total, diverse 20+ countries)

   For each: Add real intro descriptions (e.g., "Harvard: Prestigious Ivy League with strong liberal arts"), academic orientation, images (use placeholders or Unsplash-style campus photos).

2. Enhance Home/Student Home with expanded search:
   - Top: Search bar with autocomplete for university names, majors (e.g., Computer Science, Business), countries.
   - Add tabs below: "Tất cả trường" (All), "Tìm theo tên" (Name Search), "Theo chuyên ngành" (By Major – dropdown majors like Engineering, Medicine), "Theo quốc gia" (By Country – flags or dropdown: USA, UK, Australia, etc.)
   - Results: Show university cards with ONLY intro info (name, country, short description, thumbnail image, ranking). NO costs on home – move costs to detail page.

3. Update Additional Fees in University Detail and Registration:
   - Make fees optional: Checkbox list for each fee (e.g., Visa [tick], Accommodation [untick], Insurance [tick]).
   - When registering, calculate total cost based on selected fees only (student chooses what to pay).
   - In "My Costs": Show breakdown with selected fees, allow untick post-registration (simulate edit).

4. Add currency converter switcher in header (next to language): USD (default) | VND | KRW
   - Use real-time rates (as of 2026-03-02): 1 USD = 26,243 VND; 1 USD = 1,458 KRW.
   - Dynamically convert ALL costs (general + fees) when switching (e.g., $10,000 USD → 262,430,000 VND).
   - Simulate API call or use variables for rates.

5. Add fast import for universities in Admin Dashboard:
   - New button "Import Universities" → opens modal to simulate file upload (CSV/Excel).
   - Instructions: "Upload file with columns: Name, Country, Description, General Cost, Fees (JSON array), Images (URLs)".
   - After "upload", show preview table and "Add to Database" button – simulate adding 10-20 schools at once.

General: Keep multilingual (VI/EN/KR), admin editable, student read-only except fee checkboxes. Use professional blue theme, responsive. Add fake data for 100+ schools to make list feel full.