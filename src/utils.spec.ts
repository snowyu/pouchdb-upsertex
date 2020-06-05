// import 'jest-extended';
import { throwError, trimPath } from './utils';

describe('utils', () => {
  describe('trimPath', () => {
    it('should trim path correctly', () => {
      let result = trimPath('abdd/ccc');
      expect(result).toStrictEqual('abdd/ccc');
      result = trimPath('abdd/ccc//');
      expect(result).toStrictEqual('abdd/ccc');
      result = trimPath('');
      expect(result).toStrictEqual('');
    });
  })

  describe('throwError', () => {
    it('should throwError message with default status', () => {
      try {
        throwError('test');
      } catch (error) {
        expect(error).toHaveProperty('status', 404);
        expect(error).toHaveProperty('message', 'test');
      }
    });

    it('should throwError message with name', () => {
      try {
        throwError('test', 'title');
      } catch (error) {
        expect(error).toHaveProperty('name', 'title');
        expect(error).toHaveProperty('status', 404);
        expect(error).toHaveProperty('message', 'test');
      }
    });

    it('should throwError message with name and status', () => {
      try {
        throwError('test', 'title', 500);
      } catch (error) {
        expect(error).toHaveProperty('name', 'title');
        expect(error).toHaveProperty('status', 500);
        expect(error).toHaveProperty('message', 'test');
      }
    });

    it('should throwError message with object', () => {
      try {
        throwError('test', {name: 'title'});
      } catch (error) {
        expect(error).toHaveProperty('name', 'title');
        expect(error).toHaveProperty('status', 404);
        expect(error).toHaveProperty('message', 'test');
      }
    });
    it('should throwError message with object with numbered status', () => {
      try {
        throwError('test', {name: 'title', status: 123});
      } catch (error) {
        expect(error).toHaveProperty('name', 'title');
        expect(error).toHaveProperty('status', 123);
        expect(error).toHaveProperty('message', 'test');
      }
    });
    it('should throwError message with object with non-numbered status', () => {
      try {
        throwError('test', {name: 'title', status: 'hih'});
      } catch (error) {
        expect(error).toHaveProperty('name', 'title');
        expect(error).toHaveProperty('status', 404);
        expect(error).toHaveProperty('message', 'test');
      }
    });
  });
});
