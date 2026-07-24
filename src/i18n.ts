import en from './locales/en';
import id from './locales/id';

const i18nInstance = i18next.createInstance({
	lng: i18next.language,
	fallbackLng: 'en',
	resources: {
		en: { translation: en },
		id: { translation: id }
	}
});

void i18nInstance.init();

export const t = i18nInstance.t.bind(i18nInstance);