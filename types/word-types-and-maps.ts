import { Models } from 'appwrite';

const BulgarianAlphabet = [
  'а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й',
  'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у',
  'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ь', 'ю', 'я'
];

const mappingWordClass = {
  'noun': 'съществително име',    
  'verb': 'глагол',              
  'adjective': 'прилагателно име', 
  'adverb': 'наречие',            
  'exclamation': 'междуметие'     
};

type TypeOfWord = 'noun' | 'verb' | 'adjective' | 'exclamation' | 'adverb';

interface DictionaryWord extends Models.Document {
  word: string;
  dialect_region: string;
  pronunciation: string | null;
  word_class: TypeOfWord;
}

interface DictionaryWordMeaning extends Models.Document {
  definition: string,
  example_sentences: string[],
  meaning_order: number,
  word_id: string,
  assosiated_with_words_ids: string[] 
}

interface WordWithMeanings {
  word: DictionaryWord;
  meanings: DictionaryWordMeaning[];
}

export { BulgarianAlphabet, DictionaryWord, DictionaryWordMeaning, mappingWordClass, TypeOfWord, WordWithMeanings };
