// Link Ads Library của một page: chỉ ad đang chạy, mọi quốc gia, xếp theo mặc định của trang page (relevancy_monthly_grouped).
export const adsLibraryPageUrl = (pageId: string) =>
  `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&sort_data[mode]=relevancy_monthly_grouped&sort_data[direction]=desc&view_all_page_id=${pageId}`;
