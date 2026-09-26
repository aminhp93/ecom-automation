# Đánh giá chọn / không chọn cho 91 SP — cập nhật 25/09/2026
# (quyết định, nhận xét) theo STT trong sheet 'Pipeline 91 SP'
CHON_CHINH = "Chọn – SP chính"
CHON_PHU = "Chọn – SP phụ"
CHON_DP = "Chọn – dự phòng"
KHONG = "Không chọn"

E = {
1: (KHONG, """KẾT LUẬN: Không chọn làm SP chính. Nhu cầu 9/10 nhưng độ phù hợp với mô hình dropship AU của mình ~4/10.
• Số search dễ gây ảo giác: 1,556,963 search/tháng là Amazon MỸ; Amazon AU (thị trường mình bán) chỉ ~8.1k search/tháng — thấp hơn packing cubes (21.8k).
• Tỷ lệ mua/search 1.3% (thấp) vì keyword quá rộng; 19.6k lượt mua/tháng chia cho hàng trăm seller, giá TB chỉ $20/tấm → cạnh tranh giá.
• Vận hành khó: nhiều biến thể (kích thước × màu × kiểu treo), khách đo sai → đổi trả; hàng nặng/cồng kềnh → ship sang AU đắt; chất lượng không đều (lọt sáng, mùi, sai màu).
• AU có Kmart/IKEA/Spotlight bán sẵn; Temu chạy 2,104 ad active ở AU.
• Kiểm tra Meta Ads 25/09: brand thắng thật trong ngách là Guard Blinds (2,642 ad, 501 đang chạy, ad chạy liên tục 250–295 ngày, phễu advertorial '10 reasons why'; chủ yếu Mỹ 464 ad / Canada 269 / AU 47). Halo Blinds (từ 7/2026, 420 ad trong 3 tháng) là bản sao; The Better Home Guide là trang advertorial của chính Halo (link có utm_source=betterhomeguide). CQ Smart Screens là đơn vị lắp đặt địa phương QLD.
• Nhưng thứ họ bán là KHUNG NHÔM CHẮN SÁNG LÀM THEO KÍCH THƯỚC (US$100–155/cửa sổ, sản xuất 1–3 tuần, cam kết làm lại nếu đo sai, 30 ngày dùng thử) — không phải rèm vải $20. Cần xưởng làm theo size, rủi ro làm lại/đổi trả cao, hàng dài cồng kềnh, ngân sách test ad lớn → không hợp người mới vốn nhỏ.
→ HƯỚNG ĐI: chỉ làm SP phụ trong store giấc ngủ; hoặc thử bản rẻ 'rèm nam châm/dán không khoan, tự cắt vừa cửa' (xem #25). Khung nhôm làm theo size để giai đoạn sau khi có vốn + xưởng."""),

2: (CHON_CHINH, """KẾT LUẬN: Chọn — SP cốt lõi của cụm B 'Sắp xếp hành lý du lịch' (cụm được ưu tiên số 1).
• Cầu lớn ở cả 3 thị trường: Amazon AU 21.8k search/tháng (giá TB A$32), US 464k, UK 169k.
• Qua tiêu chí 'ads win' của anh Thanh: Nobl 2,027/2,700 ad active (page từ 2023), The Foldie 593 ad active (từ 2021), Simplify Living 272 (từ 2022); cùng nhiều page dạng review du lịch (Jennifer's Travels, Travel with Alan, Mia Travel Tips) → có người đủ lời để làm phễu nội dung. AU: ~660 ad, 18 advertiser, 23/30 ad chạy >60 ngày.
• Vận hành nhẹ nhàng: siêu nhẹ, không pin/chất lỏng/dễ vỡ, không claim y tế → ít rủi ro bị chặn ad.
• Dễ bán theo bộ (set 4–6 túi + túi vệ sinh) → đạt AOV A$50–100.
• Thời điểm: AU sắp vào mùa du lịch hè (T12–T1) — suy luận theo lịch nghỉ, chưa có số Trends riêng AU.
− Rủi ro: có mùa vụ; Kmart có bản rẻ; Nobl/The Foldie là đối thủ lớn → phải khác biệt bằng bộ sản phẩm + góc nội dung (gọn vali, tránh phí quá cân…), không đua giá.
→ BƯỚC TIẾP: báo giá 1688/agent (landed cost AU, cần markup ≥3x); xem 5–10 ad chạy lâu nhất của Nobl/The Foldie; đặt mẫu kiểm tra khoá kéo."""),

3: (CHON_CHINH, """KẾT LUẬN: Chọn — đề xuất làm SP HERO của cụm B (bản nâng cấp của packing cubes).
• Amazon AU 13.3k search/tháng (A$30), US 136k search với giá TB cao nhất cụm ($40), UK 39.8k.
• Cụm keyword 'compression packing cubes for travel' có tỷ lệ mua ~14% (13.3k mua/tháng US) → người search là người sẵn sàng mua.
• Có 'điểm nói' rõ cho quảng cáo: nén quần áo, xếp được nhiều hơn vào vali xách tay → dễ làm video demo trước/sau.
• Cùng bằng chứng ads win với packing cubes (Nobl, The Foldie, page review du lịch). Nhẹ, không pin, ít rủi ro chính sách.
− Rủi ro: TikTok/Trends/Meta chưa đo riêng (dùng chung số với packing cubes); khoá kéo nén là điểm dễ hỏng → phải test mẫu kỹ.
→ BƯỚC TIẾP: như #2; ưu tiên tìm nhà cung cấp có khoá kéo YKK hoặc tương đương, chụp demo nén thực tế."""),

4: (CHON_DP, """KẾT LUẬN: Chọn — phương án DỰ PHÒNG số 1 (cụm A 'Giấc ngủ'), nếu cụm du lịch không đạt giá vốn.
• Amazon AU mạnh: 16.8k search/tháng, ~3k mua/tháng, giá A$27; UK 78k search.
• Tín hiệu quảng cáo rất mạnh: Slvrsleep 187/187 ad active (từ 2023), Love Nightshift 65/65 (từ 2016), The Aergo 11/11 (từ 2021), Blissy chạy từ 2019 (296 active). AU ~480 ad, 22/28 ad >60 ngày.
• Siêu nhẹ, bundle tốt (bịt mắt lụa, scrunchie, gối) → dễ lên AOV.
− Rủi ro: lụa giả/kém (không phải mulberry thật) → hoàn tiền, review xấu; Blissy chiếm phần lớn thị phần → cần định vị khác (mulberry 22–25 momme thật, giá mềm hơn); KHÔNG claim chống lão hoá/trị mụn (dễ bị Meta chặn).
→ BƯỚC TIẾP: nếu đi hướng này, phải có giấy chứng nhận chất liệu (OEKO-TEX, test đốt) từ nhà cung cấp trước khi bán."""),

5: (CHON_PHU, """KẾT LUẬN: Chọn — SP phụ/upsell cho cụm B (bán kèm packing cubes).
• Amazon AU 4.5k search/tháng nhưng giá lẻ chỉ A$17.7 → không đủ AOV nếu bán riêng, rất hợp làm món thêm trong bộ du lịch.
• AU ~1,700 ad, 16 advertiser; The Foldie chạy nhiều ad; Voortrekka AU (brand AU) 50/50 ad active; BAGSMART bán $34 trên TikTok.
• Nhẹ, không pin, không rủi ro chính sách.
− Lưu ý: Macorner (1,723 ad active) là shop quà tặng in theo yêu cầu, không phải đối thủ trực tiếp.
→ Dùng làm 'order bump' hoặc quà tặng trong combo lớn."""),

6: (KHONG, """KẾT LUẬN: Không chọn (theo dõi tiếp).
• Điểm mạnh: Amazon US 349k search, 9.2k mua ($23); Trends tăng rất mạnh (x13 từ 2022); TikTok US bán 14.2k/30 ngày.
• Nhưng Amazon AU chỉ 2.2k search/tháng.
• Các page chạy ad ở AU chủ yếu là page 'sức khoẻ' (Essential Health Finds, Nerve Support Community, Gut Reset Project, Pure Cut) → bán bằng nỗi sợ 'vi nhựa' = claim sức khoẻ, dễ bị Meta chặn/giới hạn và khó giữ tài khoản.
• Xu hướng mới nổi từ 2024 → có thể là trend ngắn; hàng ~1kg; TikTok bán giá thấp ($17.6).
→ Chỉ xem lại nếu muốn làm store 'bếp không độc hại' ở giai đoạn sau, với góc an toàn (bền, dễ vệ sinh) thay vì claim sức khoẻ."""),

7: (KHONG, """KẾT LUẬN: Không chọn lúc này (ứng viên cho cụm D 'Ngồi làm việc' giai đoạn sau).
• Điểm mạnh: giá TB Amazon US $48, tỷ lệ mua 8.6%; TikTok SKU bán 4.5k/30 ngày; AU có DTC chạy ad lâu (Ever Cushion Store 320/810 – page 2026, Nordic Comforts 72/410 – 2024, Munichsunny 180/670 – 2023; 20/27 ad >60 ngày).
• Nhưng: không có dữ liệu Amazon AU; hàng cồng kềnh (foam) → phí ship AU cao; quảng cáo dễ đụng claim y tế (đau lưng, xương cụt).
→ Để sau khi đã chạy xong cụm du lịch."""),

8: (KHONG, """KẾT LUẬN: Không chọn.
• AOV cao (US/AU ~$55), Trends ổn định, AU ~2,300 ad và 25/29 ad chạy >60 ngày.
• Nhưng AU đã có brand lâu năm rất mạnh: thelittlebigbamboo (410/420 active, từ 2017), Ecoy (1,000/1,000, từ 2020).
• Hàng nặng, nhiều size giường (single/double/queen/king) → nhiều SKU, đổi trả; chất lượng vải tre khó kiểm soát; Amazon AU chỉ 2.5k search.
→ Khó cho người mới vốn nhỏ."""),

9: (KHONG, """KẾT LUẬN: Không chọn.
• Giá bán cao (AU TB ~A$71) và Trends tăng đều.
• Nhưng Amazon AU chỉ 1.6k search, tỷ lệ mua US 0.7% (rất thấp); AU chỉ ~150 ad, 8 advertiser; ForestlandLinen 190/2,100.
• Cùng các vấn đề của rèm: nhiều size, nặng, đổi trả.
→ Chỉ là biến thể nếu sau này có store rèm."""),

10: (CHON_PHU, """KẾT LUẬN: Chọn có điều kiện — SP phụ cho cụm B, CHỈ bản cuộn tay/không bơm điện.
• Cầu rất lớn: Amazon AU 16.7k search (A$26), UK 199k, US 378k/21k mua.
• Hợp câu chuyện 'xếp vali gọn' cùng packing cubes.
− Rủi ro: bản đang viral trên TikTok kèm bơm sạc pin (vi phạm tiêu chí không pin); Kmart bán rẻ; ad AU ít chạy lâu (7/16 ad >60 ngày); Flextail (từ 2016) là brand bơm mini mạnh.
→ Chỉ đưa vào bộ du lịch dạng túi nén cuộn tay (không cần bơm), không bán riêng."""),

11: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu US lớn (520k) nhưng AU chỉ 1.6k search.
• Mùa vụ rất mạnh (đỉnh hè gấp 4.2 lần median); BIG W bán; ad AU chủ yếu The Lad Collective (552/552) và The Oodie (brand AU lớn); claim 'làm mát' dễ bị khiếu nại nếu hàng không mát như quảng cáo.
→ Có thể test ngắn trước hè AU (T10–T12) nếu có vốn dư, không làm SP chính."""),

12: (CHON_PHU, """KẾT LUẬN: Chọn — SP phụ cho cụm B (du lịch).
• Amazon AU 14.3k search/tháng (A$30), US 220k, UK 53k.
• Qua tiêu chí ads win: Cocoon Travel Pillow 210/280 ad active (page 2023), Wander Plus 330/520 (2023); AU còn có Airze, Trtl chạy ad lâu.
− Rủi ro: AU đã có brand mạnh; gối memory foam cồng kềnh (tăng phí ship); tránh claim 'chữa đau cổ'.
→ Ưu tiên bản gọn/nén được (gối hơi hoặc foam nén chân không) để giảm phí ship."""),

13: (KHONG, """KẾT LUẬN: Không chọn.
• Trends tăng mạnh nhất cụm rèm (x1.57 từ 2022), AU giá TB A$46.
• Nhưng: phải đo cửa sổ; hộp dài/cồng kềnh khó ship quốc tế; đối thủ thật trong ngách là Guard Blinds/Halo Blinds bán khung chắn sáng làm theo size giá US$100–155 (xem phân tích ở #1).
→ Không hợp dropship cho người mới."""),

14: (KHONG, """KẾT LUẬN: Không chọn.
• Nhóm thú cưng — anh Thanh đánh giá khó và đắt ad cho người mới.
• Giá bán thấp ($12–17), chưa có dữ liệu brand trên Meta (keyword bị nhiễu); Amazon AU 4.1k search."""),

15: (KHONG, """KẾT LUẬN: Không chọn lúc này.
• Đúng hướng 'EDC gear' anh Thanh gợi ý, Trends tăng x1.7, UK 5.9k search.
• Nhưng cầu US/AU nhỏ (AU 1.4k search), tỷ lệ mua US 0.6%, TikTok bán yếu → không đủ làm hero.
→ Giữ làm SP trong store EDC nếu sau này đi hướng đó."""),

16: (KHONG, """KẾT LUẬN: Không chọn (dù không có ô đỏ nào).
• Có tín hiệu ads win thật: Companion&Co 107/107 ad active (2024), Pawprotectofficial 68/68, APAWLO 8/8, Pets Gear 24/24; UK 14.6k search, AOV tốt (A$41).
• Nhưng: nhóm thú cưng (anh Thanh khuyên người mới tránh), hàng cồng kềnh, Amazon AU chỉ 3.7k search.
→ Ví dụ cho thấy bộ lọc 'không ô đỏ' chưa đủ — phải thêm tiêu chí ngành/độ phù hợp."""),

17: (KHONG, """KẾT LUẬN: Không chọn.
• Giá TB cao ($39) nhưng tỷ lệ mua thấp (2%), không có dữ liệu AU và Meta.
→ Chỉ hợp làm phụ kiện nếu có store EDC."""),

18: (KHONG, """KẾT LUẬN: Không chọn.
• TikTok US rất mạnh (Kitsch 11.8k bán/30 ngày) nhưng Amazon AU chỉ 566 search, giá TB $9.5 → không đạt AOV.
• Đối thủ quá lớn: TYMO (>50,000 ad), Kitsch (2,351 ad active); Trends giảm từ 2024."""),

19: (KHONG, """KẾT LUẬN: Không chọn.
• Amazon US 196k search, giá TB cao ($60), AU 7.1k search (A$56) — nhìn hấp dẫn.
• Nhưng TikTok bán giá $10–16 → nguy cơ phá giá; chất lượng 'titan' khó kiểm chứng (hàng giả = hoàn tiền); trend mới từ 2024; cùng nhóm page sức khoẻ/claim vi nhựa như #6."""),

20: (KHONG, """KẾT LUẬN: Không chọn.
• TikTok US mạnh, Trends ổn định.
• Nhưng nhóm thú cưng; AU gần như không có ad Facebook (~3 ad) → chưa có bằng chứng bán được qua FB AU; Amazon AU 1.3k search."""),

21: (KHONG, """KẾT LUẬN: Không chọn.
• TikTok US rất mạnh (quà tặng nam) nhưng Amazon tỷ lệ mua 0.8%, AU chỉ 705 search.
• Thị trường có brand lớn (Ridge...) chi ads rất mạnh; chưa kiểm tra Meta."""),

22: (KHONG, """KẾT LUẬN: Không chọn.
• Tỷ lệ mua cao (8%) nhưng search US thấp (29k), không có dữ liệu AU.
• Góc 'giữ ấm mùa đông' không hợp thời điểm (AU đang vào hè); cùng các vấn đề sizing/nặng của rèm."""),

23: (KHONG, """KẾT LUẬN: Không chọn.
• Mùa vụ hè rất mạnh (x4.5) — trùng hè AU sắp tới.
• Nhưng giá sàn thấp ($16), Amazon AU chỉ 1.3k search, Kmart/Supercheap bán sẵn, phải theo size xe."""),

24: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu vừa (74k US), giá $20; không có dữ liệu AU, không có dữ liệu Meta.
→ Chỉ hợp gộp vào bundle 'nhà bếp xanh' nếu sau này làm."""),

25: (CHON_PHU, """KẾT LUẬN: Chọn để TEST — SP phụ (phiên bản dropship được của ngách rèm chắn sáng).
• Là bản 'rẻ, dễ làm' của khung chắn sáng Guard/Halo: rèm nam châm/dán/hút chân không, không khoan, khách tự cắt vừa cửa → hàng có sẵn, nhẹ, ít size, ship rẻ.
• Góc quảng cáo đã được Halo/Guard chứng minh: người thuê nhà không được khoan, người làm ca đêm, trời sáng sớm mùa hè AU; còn hợp cả khách du lịch (che cửa sổ khách sạn) → có thể đặt trong store du lịch.
• AU có DTC nhỏ chạy ad (Bilby Sleep, Sleepysundays); trang review của Halo cũng liệt kê loại này (bksai).
− Rủi ro: dữ liệu cầu còn mỏng (US không đủ số liệu, UK ~2.9k search, TikTok 182 bán/30 ngày); không kín sáng bằng khung nhôm; Temu có bản rẻ; KHÔNG dùng góc 'giúp bé ngủ' (tránh ngành mẹ & bé).
→ BƯỚC TIẾP: tìm nguồn 1688 và tính landed cost; chỉ test nhỏ sau khi cụm du lịch đã chạy."""),

26: (KHONG, """KẾT LUẬN: Không chọn.
• TikTok có SKU $24 bán 2.5k/30 ngày với góc 'che gầm giường bừa bộn'.
• Nhưng Trends thấp & đi ngang, không có dữ liệu AU/UK/Meta; nhiều size giường."""),

27: (KHONG, """KẾT LUẬN: Không chọn.
• Trends tăng x2.9 từ 2022, siêu nhẹ.
• Nhưng giá TB $10, Amazon AU 2k search, TikTok bán yếu → khó đạt AOV A$50 trừ khi làm bundle 'nhà bếp xanh'."""),

28: (KHONG, """KẾT LUẬN: Không chọn.
• Chỉ hợp bán kèm đệm ngồi (#7); Amazon AU 583 search; rủi ro claim y tế (đau lưng)."""),

29: (KHONG, """KẾT LUẬN: Không chọn.
• Mùa vụ mùa đông (x4.5) — AU đang vào hè nên sai thời điểm.
• AU không có ad FB nào → chưa ai chứng minh bán được qua FB AU; TikTok US giá chỉ $6–14."""),

30: (KHONG, """KẾT LUẬN: Không chọn.
• Hợp mùa hè AU nhưng cầu US nhỏ (24k search), không có dữ liệu AU/UK/Meta."""),

31: (KHONG, """KẾT LUẬN: Không chọn.
• Chỉ là upsell cho store ergonomic (#7); gần như không có dữ liệu UK/AU."""),

32: (KHONG, """KẾT LUẬN: Không chọn (chưa đủ dữ liệu).
• Đúng thị hiếu hè AU (đi biển) nhưng không có số liệu AU, US chỉ 5k search.
→ Nếu muốn, kiểm tra Meta Ads AU trước hè rồi mới cân nhắc."""),

33: (KHONG, """KẾT LUẬN: Không chọn.
• Tỷ lệ mua rất cao (28%) nhưng search quá nhỏ (2k US) → ngách hẹp; chỉ hợp làm upsell."""),

34: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu lớn (US 349k, AU 7.7k search) nhưng ad AU bị Temu, Protect-A-Bed (brand AU chuyên nệm) và Pillow Talk (chuỗi bán lẻ từ 2011) chiếm; hàng phổ thông có ở siêu thị; nhiều size giường."""),

35: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu lớn (AU 12k search) nhưng ad AU bị Temu phủ (hàng nghìn ad); TikTok bán tấm đệm giá $6; sizing sofa phức tạp, hàng nặng → đổi trả nhiều."""),

36: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu khổng lồ (AU 25.7k search) nhưng giá $7–15, Kmart bán rẻ, Trends đi ngang → không có biên lợi nhuận."""),

37: (KHONG, """KẾT LUẬN: Không chọn.
• Search US 1.3 triệu nhưng 59% click dồn vào vài SKU; giá sàn $9–16; hàng có sẵn ở Supercheap/Kmart."""),

38: (KHONG, """KẾT LUẬN: Không chọn.
• Giá AU cao (A$55) nhưng bản bán chạy trên TikTok toàn bản điện/pin; Kmart bán bản cơ giá rẻ; có lưỡi dao (rủi ro chính sách ad)."""),

39: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $13–15, hàng cồng kềnh, không có dữ liệu AU/Meta."""),

40: (KHONG, """KẾT LUẬN: Không chọn.
• Thú cưng + mùa vụ hè; bản gel chứa chất lỏng (vi phạm tiêu chí vận chuyển); AU 472 search."""),

41: (KHONG, """KẾT LUẬN: Không chọn.
• Tỷ lệ mua rất thấp (0.35%), nặng, không hơn rèm chắn sáng."""),

42: (KHONG, """KẾT LUẬN: Không chọn.
• Hàng siêu thị, cồng kềnh; không có lợi thế DTC."""),

43: (KHONG, """KẾT LUẬN: Không chọn.
• Hàng siêu thị giá rẻ; Amazon AU chỉ 802 search."""),

44: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu nhỏ (17k US, AU 1.4k); brand lớn (XD Design) đã chiếm."""),

45: (KHONG, """KẾT LUẬN: Không chọn.
• Thú cưng; trùng cầu với võng mèo gắn cửa sổ (#20)."""),

46: (KHONG, """KẾT LUẬN: Không chọn.
• Hàng siêu thị, không khác biệt; không có dữ liệu AU."""),

47: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $4–10 → không đạt AOV."""),

48: (KHONG, """KẾT LUẬN: Không chọn.
• Cồng kềnh (ship đắt), hàng siêu thị, claim giấc ngủ/đau cổ."""),

49: (KHONG, """KẾT LUẬN: Không chọn.
• Giá TB $10; bản đá diatomite nặng và dễ vỡ."""),

50: (KHONG, """KẾT LUẬN: Không chọn.
• Liên quan dao — anh Thanh lưu ý Meta hạn chế quảng cáo ngách này; hàng phổ thông giá $8–13."""),

51: (KHONG, """KẾT LUẬN: Không chọn.
• Giá bán sàn $4–8."""),

52: (KHONG, """KẾT LUẬN: Không chọn.
• Phải theo size từng loại xe, nặng, tỷ lệ mua 0.5%."""),

53: (KHONG, """KẾT LUẬN: Không chọn.
• Tỷ lệ mua cực thấp (0.15%), giá cao & nặng."""),

54: (KHONG, """KẾT LUẬN: Không chọn.
• Thú cưng; giá $8–16."""),

55: (KHONG, """KẾT LUẬN: Không chọn.
• Thú cưng; giá $10–13."""),

56: (KHONG, """KẾT LUẬN: Không chọn.
• Giá TB thấp ($13 US), hàng phổ thông siêu thị."""),

57: (KHONG, """KẾT LUẬN: Không chọn.
• Giá TB $7 — không đạt AOV; AU 640 search."""),

58: (KHONG, """KẾT LUẬN: Không chọn.
• Cồng kềnh, hàng siêu thị, khó bundle."""),

59: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu nhỏ (12k US), giá $15."""),

60: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu nhỏ (8.6k US, AU 863)."""),

61: (KHONG, """KẾT LUẬN: Không chọn.
• Hàng siêu thị giá rẻ."""),

62: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu nhỏ, giá $10."""),

63: (KHONG, """KẾT LUẬN: Không chọn.
• Giá TB $6–10, hàng siêu thị."""),

64: (KHONG, """KẾT LUẬN: Không chọn.
• Search US lớn nhưng là hàng siêu thị, cồng kềnh; không có dữ liệu AU."""),

65: (KHONG, """KẾT LUẬN: Không chọn.
• Giá TB $10; 48% click dồn vào vài brand."""),

66: (KHONG, """KẾT LUẬN: Không chọn làm SP bán.
• Giá $7 — chỉ nên dùng làm quà tặng kèm trong bộ du lịch (cụm B)."""),

67: (KHONG, """KẾT LUẬN: Không chọn.
• Claim y tế (khớp gối); giá thầu quảng cáo Amazon $6.3/click (rất đắt)."""),

68: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $7–10, hàng siêu thị."""),

69: (KHONG, """KẾT LUẬN: Không chọn.
• Cồng kềnh; không có dữ liệu AU."""),

70: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu nhỏ (11k US) — có thể là món phụ trong bộ du lịch nhưng không đáng ưu tiên."""),

71: (KHONG, """KẾT LUẬN: Không chọn.
• Nặng 5–10kg → phí ship quốc tế quá cao."""),

72: (KHONG, """KẾT LUẬN: Không chọn.
• Cồng kềnh, hàng siêu thị."""),

73: (KHONG, """KẾT LUẬN: Không chọn.
• Có lưỡi dao → rủi ro chính sách; cầu rất nhỏ (1.7k US)."""),

74: (KHONG, """KẾT LUẬN: Không chọn.
• Thú cưng; giá $7."""),

75: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $6; 51% click dồn vào vài SKU."""),

76: (KHONG, """KẾT LUẬN: Không chọn.
• Claim y tế (đau cổ vai gáy)."""),

77: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $7 — chỉ hợp làm quà tặng kèm bộ du lịch."""),

78: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $6 — chỉ hợp làm quà tặng kèm."""),

79: (KHONG, """KẾT LUẬN: Không chọn.
• Cầu quá nhỏ (2.9k US)."""),

80: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $10, hàng siêu thị."""),

81: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $9, hàng siêu thị; có thể dùng làm quà tặng kèm bộ du lịch."""),

82: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $8.5 — chỉ hợp làm quà tặng kèm."""),

83: (KHONG, """KẾT LUẬN: Không chọn.
• Chứa dung dịch lỏng (khó vận chuyển), cầu nhỏ."""),

84: (KHONG, """KẾT LUẬN: Không chọn (xác nhận kết luận cũ).
• Search US chỉ 1.8k/tháng, giá TB $10 (UK £4); đối thủ là shop kiểu Trung Quốc >1,000 SKU."""),

85: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $9."""),

86: (KHONG, """KẾT LUẬN: Không chọn.
• Claim y tế (trào ngược), cồng kềnh."""),

87: (KHONG, """KẾT LUẬN: Không chọn.
• Giá TB $8.5, hàng siêu thị; 54% click dồn vào vài SKU."""),

88: (KHONG, """KẾT LUẬN: Không chọn.
• Cồng kềnh, giá thấp."""),

89: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $10, có lưỡi dao."""),

90: (KHONG, """KẾT LUẬN: Không chọn.
• Giá $10."""),

91: (KHONG, """KẾT LUẬN: Không chọn.
• Thuộc nhóm vũ khí tự vệ → Meta hạn chế quảng cáo."""),
}
