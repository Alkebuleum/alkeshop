// Every country, for the seller's "Country" field: Africa first, then the
// whole world A to Z, so sellers in the diaspora can pick where they live.
// Names come from the browser (Intl.DisplayNames) from ISO 3166 codes.

const AFRICA = "DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW".split(" ");

const WORLD = (
  "AF AL AD AG AR AM AU AT AZ BS BH BD BB BY BE BZ BT BO BA BR BN BG KH CA CL CN CO CR HR CU CY CZ DK DM DO EC SV " +
  "EE FJ FI FR GE DE GR GD GT GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KI KW KG LA LV LB LI LT LU MO MY MV " +
  "MT MH MX FM MD MC MN ME MM NR NP NL NZ NI KP MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RO RU KN LC VC WS SM SA " +
  "RS SG SK SI SB KR ES LK SR SE CH SY TW TJ TH TL TO TT TR TM TV UA AE GB US UY UZ VU VA VE VN YE " +
  "AW BM KY CW GP GF MQ RE YT GU VI"
).split(" ").concat(AFRICA);

let names;
try { names = new Intl.DisplayNames(["en"], { type: "region" }); } catch { names = null; }
const nameOf = (code) => names?.of(code) || code;
const byName = (a, b) => a.localeCompare(b, "en");

export const AFRICAN_COUNTRIES = AFRICA.map(nameOf).sort(byName);
export const ALL_COUNTRIES = [...new Set(WORLD.map(nameOf))].sort(byName);
