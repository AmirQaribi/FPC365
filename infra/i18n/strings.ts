/** UI string tables for the extension's own surfaces (popup & options). */
import type { InterfaceLanguage } from "../../core/models"

export const DEFAULT_INTERFACE_LANGUAGE: InterfaceLanguage = "en"

export type I18nKey = keyof (typeof I18N_STRINGS)["en"]

export const I18N_STRINGS = {
	en: {
		pageTitle: "Fluent Persian Converter — Settings",
		appTitle: "Fluent Persian Converter",
		sectionDescription:
			"Control Persian date conversion, preview formatting, and translator for your supported Microsoft applications.",
		dateTimeConverterTitle: "Date and Time Converter",
		dateTimeConverterNote:
			"Convert Gregorian dates into Persian calendar format, plus relative values and date controls.",
		coreFeature: "Core feature",
		gregorianLabel: "Gregorian",
		gregorianDescription: "Disable conversion and show the default site dates.",
		persianLabel: "Persian",
		persianDescription: "Convert Gregorian dates throughout the page.",
		previewModePersian: "Persian",
		previewModeGregorian: "Gregorian",
		persianDigitsLabel: "Persian digits",
		persianDigitsDescription: "Show numbers in Persian numerals.",
		persianMonthNamesLabel: "Persian month names",
		persianMonthNamesDescription:
			"Replace month numbers with Persian month names.",
		convertCalendarViewsLabel: "Convert calendar views",
		convertCalendarViewsDescription:
			"Convert calendar controls like views and event dates.",
		convertDatePickersLabel: "Convert date pickers",
		convertDatePickersDescription:
			"Convert date picker controls into Persian format.",
		previewTitle: "Preview",
		previewDescription:
			"Live preview of the current date formatting based on your settings.",
		translatorTitle: "UI Translator",
		translatorNote:
			"Simulate translation of the UI into Persian. The dictionary manager is a for future translation support.",
		mockupBadge: "Preview",
		defaultLabel: "Default",
		defaultDescription: "Keep the site language unchanged.",
		translatorPersianLabel: "Persian",
		translatorPersianDescription: "Translate UI labels into Persian.",
		forceRTLLabel: "Force RTL website",
		forceRTLDescription: "Apply a right-to-left layout for the translated UI.",
		manageDictionaryTitle: "Manage dictionary",
		manageDictionaryNote: "Download and manage dictionaries",
		downloadTitle: "Download",
		toggleTitle: "Enable / disable",
		clearTitle: "Clear",
		aboutTitle: "About",
		infoBadge: "Info",
		aboutSentence1:
			'This is an <strong class="text-gray-300">open source</strong> project and is <strong class="text-gray-300">safe to use</strong>. The entire source code is publicly available for review, transparency, and contribution.',
		aboutSentence2:
			"The entire source code is publicly available for review, transparency, and contribution.",
		aboutSentence3:
			"The code is free to use and modify; however, it remains protected under its copyright license.",
		aboutSentence4:
			'Learn more, report issues, or contribute on <a href="https://github.com/AmirQaribi/DynamicsTranslate" target="_blank">GitHub</a>.',
		donateButton: "Donate",
		versionLabel: "Version",
		langEnglish: "EN",
		langPersian: "فا",
		saveToast: "Saved changes",
		openSettings: "Open settings",
		globalSettingLabel: "Global setting",
		extensionLabel: "Extension",
		extensionDescription: "Enable or disable Persian date conversion",
		siteStatusChecking: "Checking site...",
		siteStatusNoActiveTab: "No active tab",
		siteStatusInjected: "Extension not injected on this site",
		siteStatusNotSupported: "Not a supported site",
		statusLabel: "Status",
		statusOn: "On",
		statusOff: "Off",
		statusReady: "Ready",
		statusLoading: "Loading",
		siteFrameTop: "top",
		reloadBannerText: "Refresh the page to apply your changes.",
		reloadBannerRefresh: "Refresh now",
		reloadBannerDismiss: "Dismiss",
	},
	fa: {
		pageTitle: "Fluent Persian Converter — تنظیمات",
		appTitle: "Fluent Persian Converter",
		sectionDescription:
			"تنظیم تبدیل تاریخ به فارسی، پیش‌نمایش قالب‌بندی و ترجمهٔ رابط برای برنامه‌های پشتیبانی‌شدهٔ مایکروسافت.",
		dateTimeConverterTitle: "مبدل تاریخ و زمان",
		dateTimeConverterNote:
			"تبدیل تاریخ‌های میلادی به قالب تقویم فارسی، همراه با مقادیر نسبی و کنترل‌های تاریخ.",
		coreFeature: "ویژگی اصلی",
		gregorianLabel: "میلادی",
		gregorianDescription:
			"تبدیل را غیرفعال کن و تاریخ پیش‌فرض سایت را نمایش بده.",
		persianLabel: "فارسی",
		persianDescription: "تبدیل تاریخ‌های میلادی در سراسر صفحه.",
		previewModePersian: "فارسی",
		previewModeGregorian: "میلادی",
		persianDigitsLabel: "اعداد فارسی",
		persianDigitsDescription: "اعداد را با ارقام فارسی نمایش بده.",
		persianMonthNamesLabel: "نام ماه‌های فارسی",
		persianMonthNamesDescription:
			"شماره ماه‌ها را با نام ماه فارسی جایگزین کن.",
		convertCalendarViewsLabel: "تبدیل نماهای تقویم",
		convertCalendarViewsDescription:
			"کنترل‌های تقویم مانند نماها و تاریخ رویدادها را تبدیل کن.",
		convertDatePickersLabel: "تبدیل انتخابگرهای تاریخ",
		convertDatePickersDescription:
			"کنترل انتخاب تاریخ را به قالب فارسی تبدیل کن.",
		previewTitle: "پیش‌نمایش",
		previewDescription:
			"پیش‌نمایشی زنده از قالب‌بندی تاریخ فعلی بر اساس تنظیمات شما.",
		translatorTitle: "مترجم رابط کاربری",
		translatorNote:
			"ترجمه رابط کاربری به فارسی را شبیه‌سازی کن. مدیر لغت‌نامه برای پشتیبانی آینده است.",
		mockupBadge: "پیش نمایش",
		defaultLabel: "پیش‌فرض",
		defaultDescription: "زبان سایت را بدون تغییر نگه دار.",
		translatorPersianLabel: "فارسی",
		translatorPersianDescription: "برچسب‌های رابط را به فارسی ترجمه کن.",
		forceRTLLabel: "اعمال راست‌چین",
		forceRTLDescription:
			"برای رابط ترجمه‌شده، قالب راست‌چین را اعمال کن.",
		manageDictionaryTitle: "مدیریت لغت‌نامه",
		manageDictionaryNote: "دانلود و مدیریت لغت‌نامه‌ها",
		downloadTitle: "دانلود",
		toggleTitle: "فعال / غیرفعال",
		clearTitle: "پاک کردن",
		aboutTitle: "درباره",
		infoBadge: "اطلاعات",
		aboutSentence1:
			'این یک پروژه <strong class="text-gray-300">متن‌باز</strong> است و استفاده از آن <strong class="text-gray-300">ایمن است</strong>. تمام کد منبع برای بررسی، شفافیت و مشارکت به صورت عمومی در دسترس است.',
		aboutSentence2:
			"تمام کد منبع برای بررسی، شفافیت و مشارکت به صورت عمومی در دسترس است.",
		aboutSentence3:
			"کد برای استفاده و تغییر آزاد است؛ با این حال تحت مجوز حق چاپ خود محافظت می‌شود.",
		aboutSentence4:
			'بیشتر بدانید، مشکلات را گزارش دهید یا در <a href="https://github.com/AmirQaribi/DynamicsTranslate" target="_blank">GitHub</a> مشارکت کنید.',
		donateButton: "حمایت",
		versionLabel: "نسخه",
		langEnglish: "EN",
		langPersian: "فا",
		saveToast: "تغییرات ذخیره شد",
		openSettings: "باز کردن تنظیمات",
		globalSettingLabel: "تنظیم سراسری",
		extensionLabel: "افزودنی",
		extensionDescription: "تبدیل تاریخ فارسی را فعال یا غیرفعال کنید",
		siteStatusChecking: "در حال بررسی سایت...",
		siteStatusNoActiveTab: "هیچ برگه فعالی وجود ندارد",
		siteStatusInjected: "افزونه در این سایت محاوره نشده است",
		siteStatusNotSupported: "سایت پشتیبانی نمی‌شود",
		statusLabel: "وضعیت",
		statusOn: "روشن",
		statusOff: "خاموش",
		statusReady: "آماده",
		statusLoading: "در حال بارگذاری",
		siteFrameTop: "بالا",
		reloadBannerText: "برای اعمال تغییرات، صفحه را تازه‌سازی کنید.",
		reloadBannerRefresh: "تازه‌سازی",
		reloadBannerDismiss: "بستن",
	},
} as const
