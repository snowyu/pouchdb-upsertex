// import 'jest-extended';
import { throwError } from './utils';

describe('utils', () => {
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
  });
});
