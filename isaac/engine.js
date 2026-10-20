const STAN_WERSJA = 1;

const MAX_HP = 6;

const pokoje = [
    { id: 1, nazwa: "Intro / Pokój Startowy", opis: "Tutaj zaczyna się Twój koszmar." },
    { id: 2, nazwa: "Spokój", opis: "Ciche pomieszczenie, w którym czają się pułapki." },
    { id: 3, nazwa: "Skarbiec", opis: "Miejsce pełne złota i skrzyń." },
    { id: 4, nazwa: "Sklep", opis: "Tutaj handlarz oferuje ulepszenia za monety." },
    { id: 5, nazwa: "Crazy", opis: "Większe ryzyko, potwory i lepsze łupy." },
    { id: 6, nazwa: "Bossman", opis: "Legowisko mega bossa lochów." },
    { id: 7, nazwa: "Wyjście", opis: "Wolność!" }
];

function stanPoczatkowy() {
    return {
        pokoj: 1,
        hp: 6, // hp
        klucz: false, // do otwierania drzwi czy skrzynek
        bomba: 1, // nie trzeba tlumaczyc
        monety: 5, // waluta
        lzyDucha: false, // wieksza sila ataku
        przekletyAmulet: false, // ryzykowne ulepszenie
        koniec: false,
        wygrana: false,
    };
}

function czyStan(stan) {
    if (!stan || typeof stan !== "object" || Array.isArray(stan)) {
        return false;
    }

    const { pokoj, hp, klucz, bomba, monety, lzyDucha, przekletyAmulet, koniec, wygrana } = stan;

    if (!Number.isInteger(pokoj) || pokoj < 1 || pokoj > 7) return false; // int, miedzy 1 a 7
    if (!Number.isInteger(hp) || hp < 0 || hp > MAX_HP) return false; // hp to liczba miedzy 0 a MAKS
    if (!Number.isInteger(bomba) || bomba < 0) return false; // liczba bomb nie jest ujemna
    if (!Number.isInteger(monety) || monety < 0) return false; // liczba monet nie jest ujemna

    const flagi = [klucz, lzyDucha, przekletyAmulet, koniec, wygrana];
    if (!flagi.every(x => typeof x === "boolean")) return false; //czy wszystkie boole to faktycznie booleany

    if (wygrana && (!koniec || pokoj !== 7)) return false; // jak gracz wygral to musi byc gra zakonczona + pokoj 7
    if (hp === 0 && !koniec) return false; // musi byc zakonczona jak jest 0hp

    return true;
}

function przejscie(stanPrzed, komenda, argument) {
    if (stanPrzed.koniec || stanPrzed.wygrana) {
        return { stan: { ...stanPrzed }, komunikat: "Wyprawa dobiegła końca. Użyj start()." };
    }

    let nowyStan = { ...stanPrzed };
    let damage = 0;
    let komunikat = "";

    switch (komenda) {
        case "idz": {
            let nastepnyPokoj = nowyStan.pokoj;
            if (argument === "lewo") nastepnyPokoj -= 1;
            else if (argument === "prawo") nastepnyPokoj += 1;
            else {
                return { stan: { ...stanPrzed }, komunikat: `Nieznany kierunek ruchu. Użyj "lewo" lub "prawo".` };
            }

            if (nastepnyPokoj < 1 || nastepnyPokoj > 7) {
                return { stan: { ...stanPrzed }, komunikat: `Ściana! Brak przejścia w kierunku: ${argument}.` };
            }

            nowyStan.pokoj = nastepnyPokoj;
            // przejscie między pokojami w lochu niesie ryzyko potyczki
            damage = 0; // lecz ruch sam w sobie nie rani
            komunikat = `Wkraczasz do pokoju: ${pokoje.find(p => p.id === nowyStan.pokoj).nazwa}.`;
            break;
        }

        case "akcja": {
            switch (argument) {
                case "atak": {
                    if (nowyStan.pokoj === 6) { // boss TODO
                        komunikat = nowyStan.lzyDucha
                            ? "Atakujesz potężnego Bossa z mocą Łez Ducha! Zadajesz miażdżące obrażenia."
                            : "Atakujesz Bossa standardowymi łzami. Walka jest zacięta!";
                    } else {
                        komunikat = "Atakujesz potwory w pokoju, oczyszczając drogę.";
                    }
                    break;
                }
                case "unik": { // TODO
                    komunikat = "Wykonujesz zręczny unik przed gradem pocisków przeciwnika!";
                    break;
                }
                case "zbierz": {
                    if (nowyStan.pokoj === 3) { // Skarbiec
                        if (!nowyStan.klucz) {
                            nowyStan.klucz = true;
                            komunikat = "Podnosisz świecący klucz ze złotej skrzyni! (+klucz)";
                        } else {
                            komunikat = "Skrzynia jest już pusta.";
                        }
                    } else if (nowyStan.pokoj === 4) { // Sklep
                        nowyStan.monety += 3;
                        komunikat = "Zebrałeś monety porozrzucane w sklepie. (+3)";
                    } else {
                        nowyStan.bomba += 1;
                        komunikat = "Podnosisz ukrytą bombę z ziemi! (+bomba)";
                    }
                    break;
                }
                case "uzyj": {
                    if (nowyStan.hp < MAX_HP) {
                        nowyStan.hp += 1;
                        komunikat = "Używasz podniesionego serca! Odzyskujesz 1 punkt zdrowia.";
                    } else {
                        komunikat = "Twoje HP jest już na maksymalnym poziomie!";
                    }
                    break;
                }
                case "otworz": {
                    if (nowyStan.klucz) {
                        nowyStan.klucz = false;
                        komunikat = "Wpychasz klucz do zamka i otwierasz sekretne przejdźcie! (-klucz)";
                    } else {
                        komunikat = "Potrzebujesz klucza, aby otworzyć te drzwi!";
                    }
                    break;
                }
                case "sklep": {
                    if (nowyStan.pokoj === 4 && nowyStan.monety >= 5 && !nowyStan.lzyDucha) {
                        nowyStan.monety -= 5;
                        nowyStan.lzyDucha = true;
                        komunikat = "Kupujesz Łzy Ducha! Twoje pociski stają się potężniejsze.";
                    } else if (nowyStan.lzyDucha) {
                        komunikat = "Wszystkie towary w sklepie zostały wykupione.";
                    } else {
                        komunikat = "Za mało monet! Potrzebujesz 5 monet. Posiadasz " + nowyStan.monety;
                    }
                    break;
                }
                case "wyjdz": {
                    if (nowyStan.pokoj === 7) {
                        nowyStan.wygrana = true;
                        nowyStan.koniec = true;
                        komunikat = "WYGRANA! Pokonałeś lochy i uciekłeś z piwnicy!";
                        return { stan: nowyStan, komunikat };
                    } else {
                        komunikat = "Wyjście się tutaj nie znajduje!";
                    }
                    break;
                }
                default:
                    return { stan: { ...stanPrzed }, komunikat: "Nieznana akcja." };
            }
            break;
        }

        default:
            return { stan: { ...stanPrzed }, komunikat: "Nieznana akcja." };
    }

    // Losowy potwor / pulapka w pokojach (2 i 5) zadaje 1hp
    if ((nowyStan.pokoj === 2 || nowyStan.pokoj === 5) && Math.random() < 0.3) {
        damage += 1;
        komunikat += ` Otrzymujesz obrażenia od ${Math.random() < 0.3 ? "pułapki" : "potwora"}!"`
    }

    if (damage > 0) {
        nowyStan.hp -= damage;
        if (nowyStan.hp <= 0) {
            nowyStan.hp = 0;
            nowyStan.koniec = true;
            komunikat += " Zginąłeś w mrokach piwnicy... PRZEGRANA!";
        } else {
            komunikat += ` Pozostało: ${nowyStan.hp} serc.`;
        }
    }

    return { stan: nowyStan, komunikat };
}

function eksportujStan(stan) {
    const pakiet = { wersja: STAN_WERSJA, stan };
    let result = JSON.stringify(pakiet);

    let p = document.createElement("p"); // potem uproscic jako return json.str.....
    p.textContent = result;
    document.body.appendChild(p);
    return result;
}

function importujStan(tekst) {
    if (typeof tekst !== "string" || !tekst.trim()) {
        throw new Error("Pusty lub nieprawidłowy tekst.");
    }

    let pakiet;
    try {
        pakiet = JSON.parse(tekst);
    } catch (e) {
        throw new Error("Nieprawidłowy JSON.");
    }

    if (!pakiet || pakiet.wersja !== STAN_WERSJA || !czyStan(pakiet.stan)) {
        throw new Error("Niezgodna wersja lub błędny stan.");
    }
    return pakiet.stan;
}