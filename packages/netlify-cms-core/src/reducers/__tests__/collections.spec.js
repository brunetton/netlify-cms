import { OrderedMap, fromJS } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, {
  selectAllowDeletion,
  selectEntryPath,
  selectEntrySlug,
  selectFieldsMediaFolders,
  selectMediaFolders,
  getFieldsNames,
  selectField,
} from '../collections';
import { FILES, FOLDER } from 'Constants/collectionTypes';

describe('collections', () => {
  it('should handle an empty state', () => {
    expect(collections(undefined, {})).toEqual(null);
  });

  it('should load the collections from the config', () => {
    expect(
      collections(
        undefined,
        configLoaded(
          fromJS({
            collections: [
              {
                name: 'posts',
                folder: '_posts',
                fields: [{ name: 'title', widget: 'string' }],
              },
            ],
          }),
        ),
      ),
    ).toEqual(
      OrderedMap({
        posts: fromJS({
          name: 'posts',
          folder: '_posts',
          fields: [{ name: 'title', widget: 'string' }],
          type: FOLDER,
        }),
      }),
    );
  });

  describe('selectAllowDeletions', () => {
    it('should not allow deletions for file collections', () => {
      expect(
        selectAllowDeletion(
          fromJS({
            name: 'pages',
            type: FILES,
          }),
        ),
      ).toBe(false);
    });
  });

  describe('selectEntryPath', () => {
    it('should return path', () => {
      expect(
        selectEntryPath(
          fromJS({
            type: FOLDER,
            folder: 'posts',
          }),
          'dir1/dir2/slug',
        ),
      ).toBe('posts/dir1/dir2/slug.md');
    });
  });

  describe('selectEntrySlug', () => {
    it('should return slug', () => {
      expect(
        selectEntrySlug(
          fromJS({
            type: FOLDER,
            folder: 'posts',
          }),
          'posts/dir1/dir2/slug.md',
        ),
      ).toBe('dir1/dir2/slug');
    });
  });

  describe('selectFieldsMediaFolders', () => {
    it('should return empty array for invalid collection', () => {
      expect(selectFieldsMediaFolders(fromJS({}))).toEqual([]);
    });

    it('should return configs for folder collection', () => {
      expect(
        selectFieldsMediaFolders(
          fromJS({
            folder: 'posts',
            fields: [
              {
                name: 'image',
                media_folder: 'image_media_folder',
              },
              {
                name: 'body',
                media_folder: 'body_media_folder',
              },
              {
                name: 'list_1',
                field: {
                  name: 'list_1_item',
                  media_folder: 'list_1_item_media_folder',
                },
              },
              {
                name: 'list_2',
                fields: [
                  {
                    name: 'list_2_item',
                    media_folder: 'list_2_item_media_folder',
                  },
                ],
              },
            ],
          }),
        ),
      ).toEqual([
        'image_media_folder',
        'body_media_folder',
        'list_1_item_media_folder',
        'list_2_item_media_folder',
      ]);
    });

    it('should return configs for files collection', () => {
      expect(
        selectFieldsMediaFolders(
          fromJS({
            files: [
              {
                fields: [
                  {
                    name: 'image',
                    media_folder: 'image_media_folder',
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'body',
                    media_folder: 'body_media_folder',
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'list_1',
                    field: {
                      name: 'list_1_item',
                      media_folder: 'list_1_item_media_folder',
                    },
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'list_2',
                    fields: [
                      {
                        name: 'list_2_item',
                        media_folder: 'list_2_item_media_folder',
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ),
      ).toEqual([
        'image_media_folder',
        'body_media_folder',
        'list_1_item_media_folder',
        'list_2_item_media_folder',
      ]);
    });
  });

  describe('selectMediaFolders', () => {
    const slug = {
      encoding: 'unicode',
      clean_accents: false,
      sanitize_replacement: '-',
    };

    const config = fromJS({ slug });
    it('should return fields and collection folder', () => {
      expect(
        selectMediaFolders(
          { config },
          fromJS({
            folder: 'posts',
            media_folder: '/collection_media_folder',
            fields: [
              {
                name: 'image',
                media_folder: '/image_media_folder',
              },
            ],
          }),
          fromJS({ slug: 'name', path: 'src/post/post1.md' }),
        ),
      ).toEqual(['collection_media_folder', 'image_media_folder']);
    });

    it('should return fields and collection folder', () => {
      expect(
        selectMediaFolders(
          { config },
          fromJS({
            files: [
              {
                name: 'name',
                file: 'src/post/post1.md',
                media_folder: '/file_media_folder',
                fields: [
                  {
                    name: 'image',
                    media_folder: '/image_media_folder',
                  },
                ],
              },
            ],
          }),
          fromJS({ slug: 'name', path: 'src/post/post1.md' }),
        ),
      ).toEqual(['file_media_folder', 'image_media_folder']);
    });
  });

  describe('getFieldsNames', () => {
    it('should get flat fields names', () => {
      const collection = fromJS({
        fields: [{ name: 'en' }, { name: 'es' }],
      });
      expect(getFieldsNames(collection.get('fields').toArray())).toEqual(['en', 'es']);
    });

    it('should get nested fields names', () => {
      const collection = fromJS({
        fields: [
          { name: 'en', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'es', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'it', field: { name: 'title', fields: [{ name: 'subTitle' }] } },
        ],
      });
      expect(getFieldsNames(collection.get('fields').toArray())).toEqual([
        'en',
        'es',
        'it',
        'en.title',
        'en.body',
        'es.title',
        'es.body',
        'it.title',
        'it.title.subTitle',
      ]);
    });
  });

  describe('selectField', () => {
    it('should return top field by key', () => {
      const collection = fromJS({
        fields: [{ name: 'en' }, { name: 'es' }],
      });
      expect(selectField(collection, 'en')).toBe(collection.get('fields').get(0));
    });

    it('should return nested field by key', () => {
      const collection = fromJS({
        fields: [
          { name: 'en', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'es', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'it', field: { name: 'title', fields: [{ name: 'subTitle' }] } },
        ],
      });

      expect(selectField(collection, 'en.title')).toBe(
        collection
          .get('fields')
          .get(0)
          .get('fields')
          .get(0),
      );

      expect(selectField(collection, 'it.title.subTitle')).toBe(
        collection
          .get('fields')
          .get(2)
          .get('field')
          .get('fields')
          .get(0),
      );
    });
  });
});
