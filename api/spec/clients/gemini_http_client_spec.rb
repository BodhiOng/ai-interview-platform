# frozen_string_literal: true

require_relative '../../app/clients/gemini/http_client'

RSpec.describe Gemini::HttpClient do
  let(:logger) { instance_double('Logger', warn: nil, error: nil) }

  before do
    stub_const('Rails', instance_double('Rails', logger: logger))
  end

  it 'falls back to the next model after a retryable provider failure' do
    client = described_class.new(model: 'primary-model,fallback-model', api_key: 'test-key')
    failure = Gemini::HttpClient::ApiError.new('API returned 503', status: 503)

    allow(client).to receive(:request_response).with(anything, anything, 'primary-model').and_raise(failure)
    allow(client).to receive(:request_response).with(anything, anything, 'fallback-model').and_return(double)
    allow(client).to receive(:parse_response).and_return({ 'ok' => true })

    expect(client.generate_content('prompt')).to eq('ok' => true)
    expect(client).to have_received(:request_response).with(anything, anything, 'primary-model')
    expect(client).to have_received(:request_response).with(anything, anything, 'fallback-model')
  end

  it 'does not fall back for non-retryable API errors' do
    client = described_class.new(model: 'primary-model,fallback-model', api_key: 'test-key')
    failure = Gemini::HttpClient::ApiError.new('API returned 400', status: 400)

    allow(client).to receive(:request_response).and_raise(failure)

    expect { client.generate_content('prompt') }.to raise_error(Gemini::HttpClient::ApiError)
    expect(client).to have_received(:request_response).once
  end
end
