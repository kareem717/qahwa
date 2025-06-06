import {
  ToggleGroup,
  ToggleGroupItem,
} from "@qahwa/ui/components/toggle-group";
import langs from "@qahwa/desktop/lib/localization/langs";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@qahwa/desktop/lib/helpers/language_helpers";

export default function LangToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  function onValueChange(value: string) {
    setAppLanguage(value, i18n);
  }

  return (
    <ToggleGroup
      type="single"
      onValueChange={onValueChange}
      value={currentLang}
    >
      {langs.map((lang) => (
        <ToggleGroupItem key={lang.key} value={lang.key}>
          {lang.nativeName}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
