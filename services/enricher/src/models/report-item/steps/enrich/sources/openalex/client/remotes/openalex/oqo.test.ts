import { describe, expect, it } from 'vitest';

import { oqo } from './oqo';

describe('build OQO query', () => {
  it('should build OQO query', () => {
    expect.assertions(1);

    const query = oqo.sources();

    expect(query.toJSON()).toHaveProperty('get_rows', 'sources');
  });

  it('should allow to group results', () => {
    expect.assertions(1);

    const query = oqo.authors().groupBy('name').groupBy('age');

    expect(query.toJSON()).toHaveProperty('group_by', [
      { column_id: 'name' },
      { column_id: 'age' },
    ]);
  });

  it('should allow to sample results', () => {
    expect.assertions(1);

    const query = oqo.institutions().sample(5);

    expect(query.toJSON()).toHaveProperty('sample', 5);
  });

  it('should allow to select corpus for works', () => {
    expect.assertions(1);

    const query = oqo.works().corpus('expansion');

    expect(query.toJSON()).toHaveProperty('corpus', 'expansion');
  });

  it('should NOT allow to select corpus for other entity', () => {
    expect.assertions(1);

    const query = oqo.funders().corpus('expansion');

    expect(query.toJSON()).not.toHaveProperty('corpus');
  });

  it('should be serialized to JSON', () => {
    expect.assertions(1);

    const query = oqo.funders();

    expect(JSON.stringify(query)).toBe(
      '{"filter_rows":[],"get_rows":"funders","group_by":[]}'
    );
  });

  it('should support filters', () => {
    expect.assertions(1);

    const query = oqo.publishers().where(
      oqo.lt('id', 1013, true),
      oqo.or(
        oqo.is('happy', true),
        // oxlint-disable-next-line unicorn/max-nested-calls
        oqo.and(oqo.gte('money', 400), oqo.is('home', true))
      )
    );

    expect(query.toJSON()).toHaveProperty('filter_rows', [
      { column_id: 'id', is_negated: true, operator: '<', value: 1013 },
      {
        filters: [
          {
            column_id: 'happy',
            is_negated: false,
            operator: 'is',
            value: true,
          },
          {
            filters: [
              {
                column_id: 'money',
                is_negated: false,
                operator: '>=',
                value: 400,
              },
              {
                column_id: 'home',
                is_negated: false,
                operator: 'is',
                value: true,
              },
            ],
            join: 'and',
          },
        ],
        join: 'or',
      },
    ]);
  });
});
